# Async Training Helper Module for StandardRAGController
# This file contains async training methods with webhook support

import logging
import asyncio
import uuid
import threading
import requests
from DB.postgresDB import get_db_connection, run_query, delete_chunks, insert_chunk_batch
from services.embedding_service import embedding_service

async def start_training_job(chatbot_id: str, webhook_url: str = None):
    """Start async training and return immediately."""
    print(f"\n{'='*80}")
    print(f"🚀 INSIDE start_training_job()")
    print(f"   chatbot_id: {chatbot_id}")
    print(f"   webhook_url: {webhook_url}")
    print(f"{'='*80}")
    
    job_id = str(uuid.uuid4())
    print(f"📝 Generated job_id: {job_id}")

    # Get current training status directly by chatbot_id
    def get_status():
        with get_db_connection() as conn:
            query = """
                SELECT a.training_status
                FROM chatbots c
                LEFT JOIN automations a ON a.chatbot_id = c.chatbot_id
                WHERE c.chatbot_id = %s
            """
            result = run_query(conn, query, (chatbot_id,))
            return result[0] if result and len(result) > 0 else None

    result = await asyncio.to_thread(get_status)
    print(f"🔍 Got DB result: {result}")

    if result is None:
        print(f"❌ ERROR: Chatbot not found!")
        raise Exception("Chatbot not found")

    current_status = result[0]
    print(f"📊 Status: '{current_status}'")

    if current_status == 'training':
        print(f"⚠️  ALREADY TRAINING - returning early")
        return {'status': 'already_training', 'message': 'Training already in progress'}

    print(f"✅ Status check passed, continuing...")
    # Import here to avoid circular import
    from controller.standard_rag_controller import StandardRAGController
    print(f"✅ Imported RAGController")

   # Log that we're starting the job
    logging.info(f"Starting training job {job_id} for chatbot {chatbot_id}")

    print(f"💾 Updating DB status...")
    def update_db():
        with get_db_connection() as conn:
            cursor = conn.cursor()
            cursor.execute(
                "UPDATE automations SET training_status='training', training_progress=0, training_job_id=%s, training_started_at=NOW(), training_message='Training started...' WHERE chatbot_id=%s",
                (job_id, chatbot_id)
            )
            conn.commit()
            cursor.close()
    await asyncio.to_thread(update_db)
    print(f"✅ DB updated")
    await send_webhook(webhook_url, chatbot_id, 'training', 5, 'Training started', None)
    print(f"📡 Webhook sent\n")

    # Start background thread with proper sync wrapper
    print(f"🎬 Defining thread wrapper function...")
    def run_async_training():
        """Synchronous wrapper to run async function in thread"""
        print(f"🧵 THREAD FUNCTION EXECUTING for job {job_id}")
        try:
            print(f"🏃 Calling asyncio.run()...")
            asyncio.run(ingest_to_vector_db_async(
                job_id, chatbot_id, webhook_url, StandardRAGController
            ))
            print(f"✅ asyncio.run() completed")
        except Exception as e:
            print(f"❌ Thread exception: {e}")
            import traceback
            traceback.print_exc()
            logging.error(f"Background training thread failed: {e}", exc_info=True)
    
    print(f"▶️  Creating Thread object...")
    thread = threading.Thread(target=run_async_training)
    thread.daemon = True
    print(f"▶️  Calling thread.start()...")
    thread.start()
    print(f"✅ thread.start() completed")
    
    logging.info(f"Training job {job_id} thread started successfully")
    return {'job_id': job_id, 'status': 'started', 'message': 'Training started'}

async def ingest_to_vector_db_async(
    job_id: str,
    chatbot_id: str,
    webhook_url: str,
    RAGController
):
    """Background training with WebSocket progress updates."""
    try:
        logging.info(f"🚀 Starting async training job {job_id} for chatbot {chatbot_id}")

        # Step 1: Fetch
        await send_webhook(
            webhook_url, chatbot_id, 'training', 10, "Fetching training data..."
        )
        
        logging.info(f"📥 Fetching data for chatbot {chatbot_id}")
        documents, processed_items = await RAGController.fetch_and_prepare_data(chatbot_id)
        if not documents:
            logging.info(f"ℹ️  No untrained data found for chatbot {chatbot_id}")
            await send_webhook(
                webhook_url, chatbot_id, 'completed', 100, "No new data to train"
            )
            return
        
        logging.info(f"✅ Fetched {len(documents)} new documents for training")
        
        # Step 2: Prepare Chunks (Per Document)
        await send_webhook(
            webhook_url, chatbot_id, 'training', 30, "Chunking text..."
        )
        
        logging.info(f"✂️  Chunking text data")
        
        all_chunks_data = []
        total_chunks = 0
        
        # Pre-process chunks to calculate total for progress bar
        # We prefer to embed as we go? Or chunk all first? Chunking is fast.
        
        temp_chunks = []
        for doc in documents:
            source = doc['source']
            content = doc['content']
            chunks = RAGController.chunk_text(content)
            for chunk in chunks:
                temp_chunks.append({
                    'source': source,
                    'content': chunk
                })
        
        total_chunks = len(temp_chunks)
        logging.info(f"✅ Generated {total_chunks} chunks total")

        # Step 3: Embed
        await send_webhook(
             webhook_url, chatbot_id, 'training', 35, f"Embedding {total_chunks} chunks..."
        )

        logging.info(f"🔢 Starting embedding for {total_chunks} chunks")
        for i, item in enumerate(temp_chunks):
            if (i + 1) % 10 == 0 or i == total_chunks - 1:
                progress = 30 + int((i + 1) / total_chunks * 40)  # 30-70%
                await send_webhook(
                    webhook_url, chatbot_id, 'training', progress,
                    f"Embedded {i + 1}/{total_chunks} chunks..."
                )
                logging.info(f"📊 Progress: {i + 1}/{total_chunks} chunks embedded ({progress}%)")
            
            vector = embedding_service.embed_text(item['content'])
            if vector:
                all_chunks_data.append({
                    "index": i, # Global index or per file? Global is fine for now.
                    "content": item['content'],
                    "embedding": vector,
                    "source": item['source']
                })
        
        logging.info(f"✅ Embedded {len(all_chunks_data)} chunks successfully")
        
        # Step 4: Save
        await send_webhook(
            webhook_url, chatbot_id, 'training', 80, "Saving to database..."
        )
        
        from DB.postgresDB import delete_specific_chunks 
        
        # Clear specific sources before inserting (Incremental Update)
        sources_to_clear = set(d['source'] for d in documents)
        logging.info(f"💾 Clearing old chunks for {len(sources_to_clear)} sources...")
        for source in sources_to_clear:
             await asyncio.to_thread(delete_specific_chunks, chatbot_id, source)
        
        logging.info(f"💾 Inserting {len(all_chunks_data)} new chunks")
        await asyncio.to_thread(insert_chunk_batch, chatbot_id, all_chunks_data)
        
        # Step 5: Mark trained
        await send_webhook(
            webhook_url, chatbot_id, 'training', 95, "Marking items as trained..."
        )
        
        logging.info(f"✅ Marking items as trained")
        await RAGController.mark_items_as_trained(chatbot_id, processed_items)
        
        # Complete
        await send_webhook(
            webhook_url, chatbot_id, 'completed', 100, "Training completed!"
        )
        
        logging.info(f"🎉 Training job {job_id} completed successfully!")
        
    except Exception as e:
        logging.error(f"❌ Training job {job_id} failed: {e}")
        logging.error(f"Traceback:", exc_info=True)
        
        # Fallback: Update DB directly in case webhook fails
        try:
             def mark_failed():
                with get_db_connection() as conn:
                    run_query(conn, "UPDATE automations SET training_status='failed', training_message=%s WHERE chatbot_id=%s", (str(e), chatbot_id))
             await asyncio.to_thread(mark_failed)
        except Exception as db_err:
             logging.error(f"Failed to update DB status to failed: {db_err}")

        await send_webhook(
            webhook_url, chatbot_id, 'failed', 0, f"Training error: {str(e)}", str(e)
        )

async def send_webhook(
    webhook_url: str,
    chatbot_id: str,
    status: str,
    progress: int,
    message: str,
    error: str = None
):
    """Send progress update to rtserver webhook."""
    if not webhook_url:
        logging.info(f"Training {chatbot_id}: {status} - {progress}% - {message}")
        return

    def send():
        try:
            requests.post(webhook_url, json={
                'chatbot_id': chatbot_id,
                'status': status,
                'progress': progress,
                'message': message,
                'error': error
            }, timeout=5)
        except Exception as e:
            logging.error(f"Webhook failed: {e}")

    await asyncio.to_thread(send)
    logging.info(f"Training {chatbot_id}: {status} - {progress}% - {message}")
