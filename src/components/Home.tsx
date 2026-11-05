"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Welcome } from "@/components/screens/Welcome";
import { clearProgress } from "@/lib/progress";

export function Home() {
  const router = useRouter();
  return (
    <motion.main
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="relative flex h-full flex-col"
    >
      <Welcome
        onStart={() => {
          clearProgress(); // a new run starts fresh, even after finishing one in this tab
          router.push("/quiz?step=intro");
        }}
      />
    </motion.main>
  );
}
