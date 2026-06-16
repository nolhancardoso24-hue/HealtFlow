"use client";

import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Bot, Send, Copy } from "lucide-react";
import { toast } from "sonner";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const suggestions = [
  "Résume ma dernière séance avec [Patient]",
  "Questions pour [Patient]",
  "Quels sont mes patients à risque?",
];

export default function AIPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content:
        "Bonjour! Je suis votre assistant HealthFlow. Je peux résumer vos séances, suggérer des questions pour vos patients, ou analyser les patients à risque.",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  async function handleSend(text?: string) {
    const message = text ?? input;
    if (!message.trim()) return;

    setInput("");
    setMessages((prev) => [...prev.slice(-4), { role: "user", content: message }]);
    setLoading(true);

    const assistantMsg = { role: "assistant" as const, content: "" };
    setMessages((prev) => [...prev.slice(-4), { role: "user", content: message }, assistantMsg]);

    try {
      const res = await fetch("/api/ai/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      if (!res.ok) throw new Error("Erreur API");

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let fullText = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value);
          fullText += chunk;
          setMessages((prev) => {
            const updated = [...prev];
            updated[updated.length - 1] = { role: "assistant", content: fullText };
            return updated;
          });
        }
      } else {
        const data = await res.json();
        setMessages((prev) => {
          const updated = [...prev];
          updated[updated.length - 1] = { role: "assistant", content: data.content };
          return updated;
        });
      }
    } catch {
      toast.error("Erreur de l'assistant IA");
      setMessages((prev) => prev.slice(0, -1));
    } finally {
      setLoading(false);
    }
  }

  function copyLast() {
    const last = messages.filter((m) => m.role === "assistant").pop();
    if (last) {
      navigator.clipboard.writeText(last.content);
      toast.success("Copié dans le presse-papier");
    }
  }

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div className="flex items-center gap-3">
        <Bot className="h-8 w-8 text-[#0066CC]" />
        <h2 className="text-2xl font-bold">Assistant IA</h2>
      </div>

      <Card className="flex h-[calc(100vh-280px)] flex-col">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Conversation</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-1 flex-col gap-4 overflow-hidden">
          <ScrollArea className="flex-1 pr-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div
                  key={i}
                  className={`rounded-lg p-3 text-sm ${
                    msg.role === "user"
                      ? "ml-8 bg-[#0066CC] text-white"
                      : "mr-8 bg-slate-100"
                  }`}
                >
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>

          <div className="flex flex-wrap gap-2">
            {suggestions.map((s) => (
              <Button
                key={s}
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => handleSend(s)}
                disabled={loading}
              >
                {s}
              </Button>
            ))}
            <Button variant="ghost" size="sm" onClick={copyLast}>
              <Copy className="mr-1 h-3 w-3" />
              Copier
            </Button>
          </div>

          <div className="flex gap-2">
            <Textarea
              placeholder="Posez votre question..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              rows={2}
              className="resize-none"
            />
            <Button
              className="bg-[#0066CC] shrink-0"
              onClick={() => handleSend()}
              disabled={loading || !input.trim()}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
