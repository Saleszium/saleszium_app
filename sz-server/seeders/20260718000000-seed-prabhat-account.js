"use strict";

const {
  sequelize,
  organizations,
  subscriptions,
  roles,
  users,
  users_profiles,
  users_roles,
  onboardings,
  chatbots,
} = require("../models");

const EMAIL = "prabhat@rhinon.tech";
const PASSWORD = "1q2w3e";

module.exports = {
  async up() {
    const existing = await users.findOne({ where: { email: EMAIL } });
    if (existing) {
      existing.password_hash = PASSWORD; // hashed by the users model's beforeUpdate hook
      await existing.save();

      // Owner account: top tier, effectively never expires
      const subscription = await subscriptions.findOne({
        where: { organization_id: existing.organization_id },
      });
      if (subscription) {
        await subscription.update({
          subscription_tier: "Scale",
          subscription_cycle: "annual",
          subscription_start_date: new Date(),
          subscription_end_date: new Date("2099-12-31"),
        });
      }
      return;
    }

    await sequelize.transaction(async (t) => {
      const organization = await organizations.create(
        {
          organization_name: "Rhinon Tech",
          company_size: "1-5",
          organization_type: "Software",
          company_email: "support@rhinontech.saleszium.com",
        },
        { transaction: t }
      );

      await subscriptions.create(
        {
          organization_id: organization.id,
          subscription_tier: "Scale",
          subscription_cycle: "annual",
          subscription_start_date: new Date(),
          subscription_end_date: new Date("2099-12-31"),
        },
        { transaction: t }
      );

      await roles.create(
        { organization_id: organization.id, roles: ["superadmin"], access: {} },
        { transaction: t }
      );

      const user = await users.create(
        {
          email: EMAIL,
          password_hash: PASSWORD, // hashed by the users model's beforeCreate hook
          phone_number: "8249291789",
          is_email_confirmed: true,
          is_onboarded: true,
          organization_id: organization.id,
        },
        { transaction: t }
      );

      await users_profiles.create(
        {
          user_id: user.id,
          first_name: "Prabhat",
          last_name: "Patra",
        },
        { transaction: t }
      );

      await users_roles.create(
        {
          user_id: user.id,
          current_role: "superadmin",
          assigned_roles: ["superadmin"],
          permissions: {},
        },
        { transaction: t }
      );

      await onboardings.create(
        {
          organization_id: organization.id,
          tours_completed: {},
          banners_seen: {},
          installation_guide: { syncWebsite: false, customizeChatbot: false },
          chatbot_installed: false,
        },
        { transaction: t }
      );

      const { customAlphabet } = await import("nanoid");
      const nanoid = customAlphabet("1234567890ABCDEFGHIJKLMNOPQRSTUVWXYZ", 6);

      await chatbots.create(
        { organization_id: organization.id, chatbot_id: nanoid() },
        { transaction: t }
      );
    });
  },

  async down() {
    const user = await users.findOne({ where: { email: EMAIL } });
    if (!user) return;

    const organizationId = user.organization_id;

    await sequelize.transaction(async (t) => {
      await users_roles.destroy({ where: { user_id: user.id }, transaction: t });
      await users_profiles.destroy({ where: { user_id: user.id }, transaction: t });
      await users.destroy({ where: { id: user.id }, transaction: t });
      await chatbots.destroy({ where: { organization_id: organizationId }, transaction: t });
      await onboardings.destroy({ where: { organization_id: organizationId }, transaction: t });
      await roles.destroy({ where: { organization_id: organizationId }, transaction: t });
      await subscriptions.destroy({ where: { organization_id: organizationId }, transaction: t });
      await organizations.destroy({ where: { id: organizationId }, transaction: t });
    });
  },
};
