
import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Message, ConversationState, createEmptyConversationState } from '../lib/platformKnowledge';

interface ChatContextType {
    messages: Message[];
    setMessages: React.Dispatch<React.SetStateAction<Message[]>>;
    conversationState: ConversationState;
    setConversationState: React.Dispatch<React.SetStateAction<ConversationState>>;
    conversationId: string | null;
    setConversationId: React.Dispatch<React.SetStateAction<string | null>>;
    isOpen: boolean;
    setIsOpen: React.Dispatch<React.SetStateAction<boolean>>;
    brokerContextId: string | null;
    setBrokerContextId: React.Dispatch<React.SetStateAction<string | null>>;
}

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const ChatProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [conversationState, setConversationState] = useState<ConversationState>(createEmptyConversationState());
    const [conversationId, setConversationId] = useState<string | null>(null);
    const [isOpen, setIsOpen] = useState(false);
    const [brokerContextId, setBrokerContextId] = useState<string | null>(null);

    return (
        <ChatContext.Provider value={{
            messages,
            setMessages,
            conversationState,
            setConversationState,
            conversationId,
            setConversationId,
            isOpen,
            setIsOpen,
            brokerContextId,
            setBrokerContextId
        }}>
            {children}
        </ChatContext.Provider>
    );
};

export const useChat = () => {
    const context = useContext(ChatContext);
    if (!context) {
        throw new Error('useChat must be used within a ChatProvider');
    }
    return context;
};
