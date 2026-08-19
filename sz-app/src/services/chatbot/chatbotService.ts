import { PrivateAxios } from "@/helpers/PrivateAxios";

// List every chatbot for the current org (for the chatbot switcher)
export const fetchAllChatbots = async () => {
  try {
    const response = await PrivateAxios.get("/chatbot/chatbots");
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

// Fetch one specific chatbot's full config
export const fetchChatbotConfig = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.get("/chatbot/chatbots", {
      params: { chatbot_id },
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

export const updateChatbotConfig = async (
  chatbot_id: string,
  chatbot_config: any
) => {
  try {
    const response = await PrivateAxios.patch("/chatbot/chatbot-config", {
      chatbot_id: chatbot_id,
      chatbot_config: chatbot_config,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to fetch chatbots data", error);
    throw error;
  }
};

// Delete a chatbot (an org must always keep at least one)
export const deleteChatbot = async (chatbot_id: string) => {
  try {
    const response = await PrivateAxios.delete(`/chatbot/chatbots/${chatbot_id}`);
    return response.data;
  } catch (error) {
    console.error("Failed to delete chatbot", error);
    throw error;
  }
};

// Create a new chatbot for the current org (gated by subscription tier limits server-side)
export const createChatbot = async (
  chatbot_base_url?: string,
  chatbot_config?: any
) => {
  try {
    const response = await PrivateAxios.patch("/chatbot/chatbot-config", {
      create_new: true,
      chatbot_base_url,
      chatbot_config: chatbot_config || {},
    });
    return response.data;
  } catch (error) {
    console.error("Failed to create chatbot", error);
    throw error;
  }
};

export const getApiKey = async () => {
  try {
    const response = await PrivateAxios.get("/chatbot/get-api-key");
    return response.data;
  } catch (error) {
    console.error("Failed to get api key data", error);
    throw error;
  }
};

export const updateApiKey = async (apiKey: string) => {
  try {
    const response = await PrivateAxios.post("/chatbot/update-api-key", {
      apiKey,
    });
    return response.data;
  } catch (error) {
    console.error("Failed to updating api key data", error);
    throw error;
  }
};
