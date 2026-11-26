export type VideoAd = {
  src: string;
  poster: string;
  width: number;
  height: number;
  seconds: number;
  title: string;
  caption: string;
};

export const videoAds: VideoAd[] = [
  {
    src: "/videos/helmwash-bd-ad.mp4",
    poster: "/videos/helmwash-bd-ad-poster.jpg",
    width: 720,
    height: 1280,
    seconds: 42,
    title: "HelmWash BD, helmet wash ad",
    caption: "Ad made for HelmWash BD, a helmet cleaning service",
  },
  {
    src: "/videos/future-bike.mp4",
    poster: "/videos/future-bike-poster.jpg",
    width: 576,
    height: 1024,
    seconds: 10,
    title: "The future of riding",
    caption:
      "AI-made concept: how technology is changing, and the bikes that might come one day",
  },
];
