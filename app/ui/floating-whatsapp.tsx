"use client";

import Image from "next/image";

import whatsappLogo from "@/photo/logo/whatsapp (2).png";

const WHATSAPP_LINK = "https://wa.me/918240752701";

export function FloatingWhatsApp() {
  return (
    <a
      href={WHATSAPP_LINK}
      className="floating-whatsapp"
      target="_blank"
      rel="noreferrer"
      aria-label="Chat on WhatsApp"
    >
      <Image src={whatsappLogo} alt="" className="floating-whatsapp-image" />
    </a>
  );
}
