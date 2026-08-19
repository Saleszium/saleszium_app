"use strict";

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    const tables = ["automations", "chatbot_campaigns", "knowledge_bases", "articles", "folders"];

    for (const table of tables) {
      await queryInterface.addColumn(table, "chatbot_id", {
        type: Sequelize.STRING(6),
        allowNull: true,
        references: {
          model: "chatbots",
          key: "chatbot_id",
        },
        onUpdate: "CASCADE",
        onDelete: "CASCADE",
      });

      await queryInterface.addIndex(table, ["chatbot_id"], {
        name: `idx_${table}_chatbot_id`,
      });

      // Backfill: every org today has at most one chatbot, so this is unambiguous.
      await queryInterface.sequelize.query(`
        UPDATE "${table}" t
        SET chatbot_id = c.chatbot_id
        FROM "chatbots" c
        WHERE c.organization_id = t.organization_id
          AND t.chatbot_id IS NULL
      `);
    }
  },

  down: async (queryInterface) => {
    const tables = ["automations", "chatbot_campaigns", "knowledge_bases", "articles", "folders"];

    for (const table of tables) {
      await queryInterface.removeIndex(table, `idx_${table}_chatbot_id`);
      await queryInterface.removeColumn(table, "chatbot_id");
    }
  },
};
