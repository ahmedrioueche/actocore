import { useState, type FormEvent } from "react";

import { PageHero } from "@/components/site/PageHero";
import { InputField, TextArea } from "@/components/ui";
import { usePageMeta } from "@/hooks/usePageMeta";
import { useT } from "@/i18n/useT";
import { submitContactInquiry } from "@/lib/contact-api";
import { cn } from "@/lib/utils";
import { toast } from "@/stores/toast";

type FormStatus = "idle" | "loading" | "success";

export function ContactPage() {
  const { t } = useT("contact");
  usePageMeta("contact");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<FormStatus>("idle");

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus("loading");

    try {
      await submitContactInquiry({
        name: name.trim(),
        email: email.trim(),
        subject: subject.trim() || undefined,
        message: message.trim(),
      });
      setStatus("success");
      setName("");
      setEmail("");
      setSubject("");
      setMessage("");
    } catch (err) {
      setStatus("idle");
      toast.error(err instanceof Error ? err.message : t("form.error"));
    }
  };

  return (
    <div className="site-container py-16 sm:py-20">
      <PageHero title={t("title")} subtitle={t("subtitle")} />

      <form
        onSubmit={handleSubmit}
        className="mx-auto mt-12 max-w-2xl rounded-2xl border border-border bg-surface p-6 shadow-sm"
      >
        <h2 className="mb-6 text-lg font-semibold text-text-primary">
          {t("form.title")}
        </h2>

        {status === "success" ? (
          <p
            className="mb-6 rounded-xl border border-primary/30 bg-primary-muted px-4 py-3 text-sm text-text-primary"
            role="status"
          >
            {t("form.success")}
          </p>
        ) : null}

        <div className="grid gap-4 sm:grid-cols-2">
          <InputField
            id="contact-name"
            name="name"
            type="text"
            label={t("form.name")}
            placeholder={t("form.placeholders.name")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            disabled={status === "loading"}
          />
          <InputField
            id="contact-email"
            name="email"
            type="email"
            label={t("form.email")}
            placeholder={t("form.placeholders.email")}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={status === "loading"}
          />
        </div>

        <div className="mt-4">
          <InputField
            id="contact-subject"
            name="subject"
            type="text"
            label={t("form.subject")}
            placeholder={t("form.placeholders.subject")}
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            disabled={status === "loading"}
          />
        </div>

        <div className="mt-4">
          <TextArea
            id="contact-message"
            name="message"
            label={t("form.message")}
            placeholder={t("form.placeholders.message")}
            rows={5}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            disabled={status === "loading"}
          />
        </div>

        <button
          type="submit"
          disabled={status === "loading"}
          className={cn(
            "mt-6 w-full rounded-xl bg-brand-gradient px-5 py-3 text-sm font-semibold text-primary-contrast shadow-md hover:brightness-110 sm:w-auto",
            status === "loading" && "cursor-not-allowed opacity-70",
          )}
        >
          {status === "loading" ? t("form.submitting") : t("form.submit")}
        </button>
      </form>
    </div>
  );
}
