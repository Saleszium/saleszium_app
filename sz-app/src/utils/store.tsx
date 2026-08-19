// utils/store.ts
import { create } from "zustand";
import { persist } from "zustand/middleware";

export type OnboardingData = {
  tours_completed: Record<string, boolean>;
  banners_seen: Record<string, boolean>;
  installation_guide: {
    syncWebsite?: boolean;
    customizeChatbot?: boolean;
    addTeamMember?: boolean;
  };
  chatbot_installed: boolean;
};

export type UserData = {
  userId: number;
  orgId: number;
  isPlanValid: boolean;
  planExpiryDate: string;
  orgName: string;
  currentRole: string;
  assignedRoles: string[];
  assignedRolePermissions: Record<string, string>;
  userEmail: string;
  userFirstName: string;
  userLastName: string;
  profilePic: string | null;
  assignedBy: number;
  companySize: string;
  orgRoles: string[];
  orgRolesAccess: Record<string, string>;
  orgPlan: string;
  seoComplianceTriggerCount: number;
  seoPerformanceTriggerCount: number;
  trafficCount: number;
  newChatCount: number;
  newTicketCount: number;

  onboarding: OnboardingData;
};

export type ChatbotSummary = {
  id: number;
  chatbot_id: string;
  chatbot_base_url: string | null;
  chatbot_config: Record<string, any>;
  created_at?: string;
};

export type AdminActions = {
  setUsetData: (data: Partial<UserData>) => void;
};

export type TicketType = "all" | "in_progress" | "resolved";

interface TicketStore {
  ticketType: TicketType;
  setTicketType: (type: TicketType) => void;
}

interface BannerState {
  isShowBanner: boolean;
  setIsShowBanner: (value: boolean) => void;
}

const initialUserData: UserData = {
  userId: 0,
  orgId: 0,
  trafficCount: 0,
  newChatCount: 0,
  newTicketCount: 0,
  isPlanValid: true,
  planExpiryDate: "",
  orgName: "",
  currentRole: "",
  assignedRoles: [],
  assignedRolePermissions: {},
  userEmail: "",
  userFirstName: "",
  userLastName: "",
  profilePic: null,
  assignedBy: 0,
  companySize: "",
  orgRoles: [],
  orgRolesAccess: {},
  orgPlan: "Trial",
  seoComplianceTriggerCount: 0,
  seoPerformanceTriggerCount: 0,
  onboarding: {
    tours_completed: {},
    banners_seen: {},
    installation_guide: {
      syncWebsite: false,
      customizeChatbot: false,
      addTeamMember: false,
    },
    chatbot_installed: false,
  },
};

export const useUserStore = create<{
  userData: UserData;
  setUserData: (data: Partial<UserData>) => void;
  chatbots: ChatbotSummary[];
  activeChatbotId: string;
  setChatbots: (chatbots: ChatbotSummary[]) => void;
  setActiveChatbotId: (chatbotId: string) => void;
}>()(
  persist(
    (set, get) => ({
      userData: initialUserData,
      setUserData: (data) =>
        set((state) => ({
          userData: { ...state.userData, ...data },
        })),
      chatbots: [],
      activeChatbotId: "",
      setChatbots: (chatbots) =>
        set((state) => {
          const activeStillValid = chatbots.some(
            (c) => c.chatbot_id === state.activeChatbotId
          );
          return {
            chatbots,
            activeChatbotId: activeStillValid
              ? state.activeChatbotId
              : chatbots[0]?.chatbot_id || "",
          };
        }),
      setActiveChatbotId: (chatbotId) => set({ activeChatbotId: chatbotId }),
    }),
    {
      name: "user-data",
    }
  )
);

export const useTicketStore = create<TicketStore>()(
  persist(
    (set) => ({
      ticketType: "all",
      setTicketType: (type) => set({ ticketType: type }),
    }),
    {
      name: "ticket-type-store",
    }
  )
);

export const useBannerStore = create<BannerState>((set) => ({
  isShowBanner: false,
  setIsShowBanner: (value) => set({ isShowBanner: value }),
}));
