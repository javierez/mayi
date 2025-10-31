"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "~/components/ui/select";

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
  currentUserId: _currentUserId,
}: AgentSelectorProps) {
  const getAgentDisplayName = (agent: Agent) => {
    return agent.firstName && agent.lastName
      ? `${agent.firstName} ${agent.lastName}`
      : agent.name;
  };

  const selectedAgent = agents.find((agent) => agent.id === selectedAgentId);
  const selectedName = selectedAgent ? getAgentDisplayName(selectedAgent) : "";

  return (
    <Select value={selectedAgentId} onValueChange={onAgentChange}>
      <SelectTrigger className="w-[200px] border-border/40 bg-background text-sm shadow-sm hover:bg-accent/50">
        <SelectValue placeholder="Seleccionar agente">
          {selectedName}
        </SelectValue>
      </SelectTrigger>
      <SelectContent>
        {agents.map((agent) => (
          <SelectItem key={agent.id} value={agent.id}>
            {getAgentDisplayName(agent)}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
