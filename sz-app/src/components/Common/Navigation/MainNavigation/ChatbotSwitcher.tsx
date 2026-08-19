"use client";

import { useState } from "react";
import { Bot, Check, Plus, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { useUserStore } from "@/utils/store";
import { createChatbot, fetchAllChatbots } from "@/services/chatbot/chatbotService";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export function ChatbotSwitcher() {
  const chatbots = useUserStore((state) => state.chatbots);
  const activeChatbotId = useUserStore((state) => state.activeChatbotId);
  const setActiveChatbotId = useUserStore((state) => state.setActiveChatbotId);
  const setChatbots = useUserStore((state) => state.setChatbots);
  const [isOpen, setIsOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  if (!chatbots.length) {
    return null;
  }

  const handleCreateChatbot = async () => {
    if (creating) return;
    setCreating(true);
    try {
      await createChatbot();
      const updated = await fetchAllChatbots();
      setChatbots(updated);
      const newest = updated[updated.length - 1];
      if (newest) setActiveChatbotId(newest.chatbot_id);
      toast.success("Chatbot created successfully");
      setIsOpen(false);
    } catch (error: any) {
      const message =
        error?.response?.data?.message || "Failed to create chatbot";
      toast.error(message);
    } finally {
      setCreating(false);
    }
  };

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="relative rounded-full"
          title="Switch chatbot">
          <Bot className="h-5 w-5" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <div className="flex items-center justify-between p-3 border-b">
          <h4 className="font-semibold text-sm">Chatbots</h4>
          <span className="text-xs text-muted-foreground">
            {chatbots.length} total
          </span>
        </div>
        <div className="flex flex-col max-h-72 overflow-y-auto p-1">
          {chatbots.map((chatbot) => {
            const isActive = chatbot.chatbot_id === activeChatbotId;
            return (
              <button
                key={chatbot.chatbot_id}
                onClick={() => {
                  setActiveChatbotId(chatbot.chatbot_id);
                  setIsOpen(false);
                }}
                className={cn(
                  "flex items-center gap-3 rounded-md p-2.5 text-left text-sm transition-colors hover:bg-muted/60",
                  isActive && "bg-muted"
                )}>
                <div className="flex size-8 shrink-0 items-center justify-center rounded-md border bg-background">
                  <Bot className="size-4 text-primary" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-medium">{chatbot.chatbot_id}</p>
                  <p className="flex items-center gap-1 truncate text-xs text-muted-foreground">
                    <Globe className="size-3 shrink-0" />
                    {chatbot.chatbot_base_url || "No host configured"}
                  </p>
                </div>
                {isActive && (
                  <Check className="size-4 shrink-0 text-primary" />
                )}
              </button>
            );
          })}
        </div>
        <div className="border-t p-1">
          <button
            onClick={handleCreateChatbot}
            disabled={creating}
            className="flex w-full items-center gap-3 rounded-md p-2.5 text-left text-sm text-muted-foreground transition-colors hover:bg-muted/60 disabled:opacity-50">
            <div className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed">
              <Plus className="size-4" />
            </div>
            <span className="font-medium">
              {creating ? "Creating..." : "Add Chatbot"}
            </span>
          </button>
        </div>
      </PopoverContent>
    </Popover>
  );
}
