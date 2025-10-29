"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";
import { Users } from "lucide-react";

interface Agent {
  id: string;
  firstName: string;
  lastName: string;
  name: string;
  email: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  selectedAgentId: string;
  onAgentChange: (agentId: string) => void;
  currentUserId: string;
}

export function AgentSelector({
  agents,
  selectedAgentId,
  onAgentChange,
  currentUserId,
}: AgentSelectorProps) {
  const getAgentDisplayName = (agent: Agent, includeBadge = false) => {
    const fullName =
      agent.firstName && agent.lastName
        ? `${agent.firstName} ${agent.lastName}`
        : agent.name;
    return agent.id === currentUserId && !includeBadge
      ? `${fullName} (Tú)`
      : fullName;
  };

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const selectedName = selectedAgent
    ? getAgentDisplayName(selectedAgent)
    : "";

  return (
    <div className="mb-2 flex items-center justify-between border-b pb-4">
      <div className="flex items-center gap-3">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10">
          <Users className="h-5 w-5 text-primary" />
        </div>
        <span className="text-base font-semibold">{selectedName}</span>
      </div>

      <Select value={selectedAgentId} onValueChange={onAgentChange}>
        <SelectTrigger className="w-[240px] border-muted bg-muted/30 hover:bg-muted/50">
          <SelectValue placeholder="Cambiar agente" />
        </SelectTrigger>
        <SelectContent>
          {agents.map((agent) => (
            <SelectItem key={agent.id} value={agent.id}>
              <div className="flex items-center gap-2">
                <span>{getAgentDisplayName(agent, true)}</span>
                {agent.id === currentUserId && (
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-xs text-primary">
                    Tú
                  </span>
                )}
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}
