const { automations, onboardings, articles, chatbots } = require("../models");
const axios = require("axios");
const { logActivity } = require("../utils/activityLogger");

/**
 * Normalize training items to ensure they have is_trained field
 */
function normalizeTrainingItems(items, type) {
  if (!items || !Array.isArray(items)) return [];
  return items.map(item => ({
    ...item,
    is_trained: item.is_trained !== undefined ? item.is_trained : false
  }));
}

// Confirms the given chatbot_id actually belongs to the requesting org
async function assertChatbotBelongsToOrg(chatbot_id, organization_id) {
  const chatbot = await chatbots.findOne({ where: { chatbot_id, organization_id } });
  return chatbot;
}

const getAllAutomation = async (req, res) => {
  const { organization_id } = req.user;
  const { chatbot_id } = req.query;

  if (!organization_id) {
    return res.status(400).json({ error: "Organization ID is required" });
  }
  if (!chatbot_id) {
    return res.status(400).json({ error: "chatbot_id is required" });
  }

  try {
    const chatbot = await assertChatbotBelongsToOrg(chatbot_id, organization_id);
    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    const automation = await automations.findOne({
      where: { chatbot_id },
    });

    if (automation) {
      // Normalize existing data to ensure all items have is_trained field
      if (automation.training_url) {
        automation.training_url = normalizeTrainingItems(automation.training_url, 'url');
      }
      if (automation.training_pdf) {
        automation.training_pdf = normalizeTrainingItems(automation.training_pdf, 'pdf');
      }
      if (automation.training_article) {
        automation.training_article = normalizeTrainingItems(automation.training_article, 'article');
      }

      return res.status(200).json(automation);
    } else {
      return res.status(404).json({ error: "Automation not found" });
    }
  } catch (error) {
    console.error("Error fetching automation:", error.message);
    return res.status(500).json({ error: "Internal server error" });
  }
};

const createOrUpdateAutomation = async (req, res) => {
  const io = req.app.get("io"); // get WebSocket instance
  const { organization_id, user_id } = req.user;
  const { chatbot_id, training_url, training_pdf, training_article, isChatbotTrained } =
    req.body;

  if (!chatbot_id) {
    return res.status(400).json({ error: "chatbot_id is required" });
  }

  if (
    !training_url &&
    !training_pdf &&
    !training_article &&
    !isChatbotTrained
  ) {
    return res.status(400).json({
      error:
        "At least one of 'training_url', 'training_pdf', 'training_article', or 'isChatbotTrained' must be provided",
    });
  }

  try {
    const chatbot = await assertChatbotBelongsToOrg(chatbot_id, organization_id);
    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // STEP 1: create/update automation
    let automation = await automations.findOne({ where: { chatbot_id } });

    if (automation) {
      if (training_url) automation.training_url = training_url;
      if (training_pdf) automation.training_pdf = training_pdf;
      if (training_article) automation.training_article = training_article;
      if (typeof isChatbotTrained !== "undefined")
        automation.is_chatbot_trained = isChatbotTrained;

      await automation.save();
    } else {
      automation = await automations.create({
        organization_id,
        chatbot_id,
        training_url: training_url || [],
        training_pdf: training_pdf || [],
        training_article: training_article || [],
        is_chatbot_trained: isChatbotTrained || false,
      });
    }

    // STEP 2: Conditionally update onboarding
    let onboardingRecord = await onboardings.findOne({
      where: { organization_id },
    });

    if (!onboardingRecord) {
      onboardingRecord = await onboardings.create({
        organization_id,
        installation_guide: { syncWebsite: true },
      });
      io.emit("onboarding:updated", { organization_id });
    } else {
      const installationGuide = onboardingRecord.installation_guide || {};
      if (!installationGuide.syncWebsite) {
        installationGuide.syncWebsite = true;
        onboardingRecord.installation_guide = installationGuide;
        onboardingRecord.changed("installation_guide", true);
        await onboardingRecord.save();
        io.emit("onboarding:updated", { organization_id });
      }
    }

    // STEP 4: Return success (training will be triggered separately from frontend)
    return res.status(200).json({
      message: "Automation data saved successfully",
      automation
    });
  } catch (error) {
    console.error(error);
    return res
      .status(500)
      .json({ message: "Internal server error", error: error.message });
  }
};

const getArticleForAutomation = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
      return res.status(400).json({ message: "chatbot_id is required" });
    }

    const chatbot = await assertChatbotBelongsToOrg(chatbot_id, organization_id);
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    const article = await articles.findAll({ where: { chatbot_id } });

    if (!article) {
      return res.status(404).json({ message: "Article not found" });
    }

    res.status(200).json(article);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};

const analyzeURL = async (req, res) => {
  const { url } = req.body;

  try {
    const response = await fetch(url, { timeout: 5000 });
    const html = await response.text();

    const titleMatch = html.match(/<title>(.*?)<\/title>/i);
    const title = titleMatch ? titleMatch[1] : "No title found";

    const domain = new URL(url).hostname;

    let sitemapExists = false;
    let pageCount = null;

    try {
      const sitemapUrl = new URL("/sitemap.xml", url).href;
      const sitemapRes = await fetch(sitemapUrl, { timeout: 5000 });

      if (sitemapRes.ok) {
        const sitemapXml = await sitemapRes.text();

        if (
          sitemapXml.includes("<urlset") ||
          sitemapXml.includes("<sitemapindex")
        ) {
          sitemapExists = true;
          pageCount = (sitemapXml.match(/<url>/g) || []).length;
        }
      }
    } catch (error) {
      console.error("failed to check sitemap", error);
    }
    res.json({
      success: true,
      url,
      title,
      domain,
      sitemap: {
        exists: sitemapExists,
        pageCount,
      },
      nextAction: sitemapExists ? "auto_scrape" : "manual_urls",
    });
  } catch (err) {
    console.error(err);
    res.status(400).json({ success: false, message: "Website not reachable" });
  }
};

const triggerTraining = async (req, res) => {
  const io = req.app.get("io");
  const { organization_id } = req.user;
  const { chatbot_id } = req.body;

  if (!chatbot_id) {
    return res.status(400).json({ error: "chatbot_id is required" });
  }

  try {
    const chatbot = await assertChatbotBelongsToOrg(chatbot_id, organization_id);

    if (!chatbot) {
      return res.status(404).json({ error: "Chatbot not found" });
    }

    // Check current status to prevent double-triggering
    const automation = await automations.findOne({ where: { chatbot_id } });
    if (automation && automation.training_status === 'training') {
      return res.status(200).json({
        status: 'already_training',
        message: 'Training already in progress'
      });
    }

    // Call backendai with webhook URL
    const AI_URL = process.env.INTERNAL_AI_API_URL || "http://backendai:5002";
    const SZSERVER_URL = process.env.INTERNAL_SZSERVER_URL || "http://sz-server:5000";

    const response = await axios.post(`${AI_URL}/api/ingest`, {
      chatbot_id: chatbot.chatbot_id,
      webhook_url: `${SZSERVER_URL}/api/automations/training-webhook`
    });

    // backendai will call webhook which will emit WebSocket events
    return res.status(200).json(response.data);
  } catch (error) {
    console.error("Error triggering training:", error);

    // Emit error event
    io.emit(`training:error:${chatbot_id}`, {
      message: "Failed to start training",
      chatbot_id,
      error: error.message
    });

    return res.status(500).json({
      error: "Failed to trigger training",
      message: error.message
    });
  }
};

// Webhook endpoint for backendai to send progress updates
const trainingWebhook = async (req, res) => {
  const io = req.app.get("io");
  const { chatbot_id, status, progress, message, error } = req.body;

  try {
    // Update database
    const automation = await automations.findOne({ where: { chatbot_id } });
    if (automation) {
      automation.training_status = status;
      automation.training_progress = progress;
      automation.training_message = message;
      await automation.save();
    }

    // Emit WebSocket event based on status
    if (status === 'training') {
      io.emit(`training:progress:${chatbot_id}`, {
        chatbot_id,
        progress,
        message
      });
    } else if (status === 'completed') {
      io.emit(`training:completed:${chatbot_id}`, {
        chatbot_id,
        message
      });
    } else if (status === 'failed') {
      io.emit(`training:error:${chatbot_id}`, {
        chatbot_id,
        message,
        error
      });
    }

    res.status(200).json({ success: true });
  } catch (err) {
    console.error("Webhook error:", err);
    res.status(500).json({ error: err.message });
  }
};

const deleteTrainingSource = async (req, res) => {
  const { organization_id } = req.user;
  const { chatbot_id, source, type } = req.body;

  if (!chatbot_id || !source || !type) {
    return res.status(400).json({ error: "chatbot_id, source and type are required" });
  }

  try {
    const chatbot = await assertChatbotBelongsToOrg(chatbot_id, organization_id);

    if (!chatbot) {
      console.warn(`Chatbot ${chatbot_id} not found for org ${organization_id} during delete`);
    }

    // 1. Call backendai to delete vectors (idempotent - if not found, ok)
    if (chatbot) {
      const AI_URL = process.env.INTERNAL_AI_API_URL || "http://backendai:5002";
      try {
        await axios.post(`${AI_URL}/api/delete_source`, {
          chatbot_id: chatbot.chatbot_id,
          source: source
        });
      } catch (aiError) {
        console.error("Failed to delete source from AI backend:", aiError.message);
        // Continue to remove from DB even if vector delete fails (clean up reference)
      }
    }

    // 2. Remove from 'automations' list in Postgres (JSONB)
    const automation = await automations.findOne({ where: { chatbot_id } });
    if (automation) {
      let updated = false;
      if (type === 'url' && automation.training_url) {
        const initialLen = automation.training_url.length;
        automation.training_url = automation.training_url.filter(item => item.url !== source);
        if (automation.training_url.length !== initialLen) updated = true;
      } else if (type === 'file' && automation.training_pdf) {
        const initialLen = automation.training_pdf.length;
        automation.training_pdf = automation.training_pdf.filter(item => item.s3Name !== source);
        if (automation.training_pdf.length !== initialLen) updated = true;
      } else if (type === 'article' && automation.training_article) {
        const initialLen = automation.training_article.length;
        automation.training_article = automation.training_article.filter(item => item.id !== source);
        if (automation.training_article.length !== initialLen) updated = true;
      }

      if (updated) {
        await automation.save();
      }
    }

    return res.status(200).json({ message: "Source deleted successfully" });

  } catch (error) {
    console.error("Delete source error:", error);
    return res.status(500).json({ error: error.message });
  }
};

module.exports = {
  analyzeURL,
  getAllAutomation,
  createOrUpdateAutomation,
  getArticleForAutomation,
  triggerTraining,
  trainingWebhook,
  deleteTrainingSource
};
