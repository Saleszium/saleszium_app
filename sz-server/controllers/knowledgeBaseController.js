const {
  knowledge_bases,
  organizations,
  chatbots,
  articles,
  folders,
  Sequelize,
} = require("../models");
const { Op } = Sequelize;

exports.getKBByIdentifier = async (req, res) => {
  try {
    const { identifier } = req.params;

    // 1. Try to find by UUID first
    let kb = await knowledge_bases.findOne({ where: { uuid: identifier } });

    // 2. If not found, try to find by help_center_url slug
    if (!kb) {
      kb = await knowledge_bases.findOne({
        where: Sequelize.literal(`"theme"->>'help_center_url' = '${identifier}'`)
      });
    }

    if (!kb) {
      return res.status(404).json({ message: "Knowledge Base not found" });
    }

    const chatbot_id = kb.chatbot_id;

    // 3. Pull folders
    const foldersDetails = await folders.findAll({
      where: { chatbot_id },
      raw: true,
    });

    // 4. Pull articles
    const articlesDetails = await articles.findAll({
      where: { chatbot_id },
      raw: true,
    });

    // 5. Map articles → folders
    const articleMap = {};
    for (const article of articlesDetails) {
      const folderId = article.folder_id;
      if (!articleMap[folderId]) articleMap[folderId] = [];

      articleMap[folderId].push({
        articleId: article.id,
        title: article.title,
        content: article.content,
        status: article.status,
        views: article.views,
        keywords: article.keywords,
        seoTitle: article.seo_title,
        seoDescription: article.seo_description,
        likes: article.likes,
        dislikes: article.dislikes,
        updatedAt: article.updated_at,
        createdAt: article.created_at,
      });
    }

    // 6. Format folders
    const formattedFolders = foldersDetails.map((folder) => ({
      folder_id: folder.id,
      name: folder.name,
      description: folder.description,
      parent_id: folder.parent_id,
      articles: articleMap[folder.id] || [],
    }));

    // 7. Send response including theme/settings
    res.json({
      uuid: kb.uuid,
      chatbotId: chatbot_id,
      orgId: kb.organization_id,
      theme: kb.theme || {},
      folders: formattedFolders,
    });
  } catch (err) {
    console.error("Error in getKBByIdentifier:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.getKBByOrgId = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id } = req.query;

    if (!chatbot_id) {
      return res.status(400).json({ message: "chatbot_id is required" });
    }

    const chatbot = await chatbots.findOne({ where: { chatbot_id, organization_id } });
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // 1. Find or create KB by chatbot_id
    const [kb] = await knowledge_bases.findOrCreate({
      where: { chatbot_id },
      defaults: { organization_id, chatbot_id },
    });

    // 2. Fetch folders
    const foldersDetails = await folders.findAll({
      where: { chatbot_id },
      raw: true,
    });

    // 3. Fetch articles
    const articlesDetails = await articles.findAll({
      where: { chatbot_id },
      raw: true,
    });

    // 4. Map articles -> folders
    const articleMap = {};
    for (const article of articlesDetails) {
      const folderId = article.folder_id;

      if (!articleMap[folderId]) articleMap[folderId] = [];

      articleMap[folderId].push({
        articleId: article.id,
        title: article.title,
        content: article.content,
        status: article.status,
        views: article.views,
        keywords: article.keywords,
        seoTitle: article.seo_title,
        seoDescription: article.seo_description,
        likes: article.likes,
        dislikes: article.dislikes,
        updatedAt: article.updated_at,
        createdAt: article.created_at,
      });
    }

    // 5. Format folders
    const formattedFolders = foldersDetails.map((folder) => ({
      folder_id: folder.id,
      name: folder.name,
      description: folder.description,
      parent_id: folder.parent_id,
      articles: articleMap[folder.id] || [],
    }));

    // 6. Response matches the exact structure as uuid version
    res.json({
      uuid: kb.uuid,
      chatbotId: chatbot_id,
      orgId: organization_id,
      theme: kb.theme || {},
      folders: formattedFolders,
    });

  } catch (err) {
    console.error("Error in getKBByOrgId:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.updateKBTheme = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id, ...updates } = req.body;

    if (!chatbot_id) {
      return res.status(400).json({ message: "chatbot_id is required" });
    }

    const kb = await knowledge_bases.findOne({ where: { chatbot_id, organization_id } });
    if (!kb) {
      return res.status(404).json({ message: "Knowledge Base not found" });
    }

    const newTheme = {
      ...kb.theme,
      ...updates,
      seo: {
        ...kb.theme?.seo,
        ...updates.seo,
      },
    };

    await kb.update({ theme: newTheme });

    res.json({
      message: "Theme updated successfully",
      theme: newTheme,
    });

  } catch (err) {
    console.error("Error updating theme:", err);
    res.status(500).json({ error: err.message });
  }
};

exports.createKBForOrg = async (req, res) => {
  try {
    const { organization_id } = req.user;
    const { chatbot_id } = req.query;

    if (!organization_id) {
      return res.status(400).json({ message: "organization_id is required" });
    }
    if (!chatbot_id) {
      return res.status(400).json({ message: "chatbot_id is required" });
    }

    // Check if organization exists
    const org = await organizations.findByPk(organization_id);
    if (!org) {
      return res.status(404).json({ message: "Organization not found" });
    }

    const chatbot = await chatbots.findOne({ where: { chatbot_id, organization_id } });
    if (!chatbot) {
      return res.status(404).json({ message: "Chatbot not found" });
    }

    // create new Knowledge Base entry
    const kb = await knowledge_bases.create({ organization_id, chatbot_id });

    res.status(201).json({
      message: "Knowledge Base created successfully",
      uuid: kb.uuid,
      domain: `${kb.uuid}.${kb.domain}`,
    });
  } catch (err) {
    console.error("Error in createKBForOrg:", err);
    res.status(500).json({ error: err.message });
  }
};
