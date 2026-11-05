import { asset } from "@/lib/assets";

// Figma panel outlines (Version 1 · Glass light), normalised to 0–1 for clipPathUnits="objectBoundingBox".
// `overflow` places the exported SVG (which includes its drop shadow) around the shape's box.

export const questionPanel = {
  src: asset("/images/ui/question/panel-desktop.webp"),
  clip: "M0.1018 0 C0.4174 0.0362 0.6174 0.041 0.8982 0 C0.9661 0 1 0.0253 1 0.0759 C0.9629 0.3802 0.9591 0.6071 1 0.9241 C1 0.9747 0.9661 1 0.8982 1 C0.6106 0.9618 0.4197 0.965 0.1018 1 C0.0339 1 0 0.9747 0 0.9241 C0.0432 0.6023 0.0432 0.429 0 0.0759 C0 0.0253 0.0339 0 0.1018 0 Z",
  overflow: "-3.47% -5.76% -8.51% -5.76%",
};

export const resultPanel = {
  src: asset("/images/ui/result/panel-desktop.webp"),
  clip: "M0.1018 0.002 C0.3944 0.01 0.6257 0.0182 0.8982 0.002 C0.9661 0.002 1 0.0273 1 0.0778 C0.9701 0.3775 0.9701 0.6336 1 0.9243 C1 0.9748 0.9661 1 0.8982 1 C0.6198 0.9796 0.4042 0.9818 0.1018 1 C0.0339 1 0 0.9748 0 0.9243 C0.0314 0.6181 0.0347 0.3895 0.0032 0.0609 C0.0032 0.0104 0.0274 0 0.1018 0.002 Z",
  overflow: "-4.21% -6.45% -11.58% -6.45%",
};

// Mobile frames share one outline; only the exported SVG (and its shadow overflow) differs.
const mobileClip =
  "M0.1018 0 C0.3862 0.014 0.6257 0.0162 0.8982 0 C0.9661 0 1 0.0253 1 0.0759 C0.9701 0.3762 0.9701 0.6329 1 0.9241 C1 0.9747 0.9661 1 0.8982 1 C0.6198 0.9796 0.4042 0.9818 0.1018 1 C0.0339 1 0 0.9747 0 0.9241 C0.0314 0.6173 0.0314 0.4051 0 0.0759 C0 0.0253 0.0339 0 0.1018 0 Z";

export const questionPanelMobile = {
  src: asset("/images/ui/question/panel-mobile.webp"),
  clip: mobileClip,
  overflow: "-4.44% -10.78% -11.56% -10.78%",
};

export const resultPanelMobile = {
  src: asset("/images/ui/result/panel-mobile.webp"),
  clip: mobileClip,
  overflow: "-5.97% -11.23% -14.86% -11.23%",
};
