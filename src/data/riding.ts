export type RidePhoto = {
  src: string;
  alt: string;
  caption: "On tour" | "Group ride" | "Sunset ride" | "Malaysia tour";
  width: number;
  height: number;
};

export const ridingHero = {
  src: "/riding/r15-sunset-portrait.jpg",
  alt: "Sunset ride.",
  caption: "Sunset ride",
} as const;

export const ridingPhotos: RidePhoto[] = [
  {
    src: "/riding/r15-sunset-portrait.jpg",
    alt: "Sunset ride.",
    caption: "Sunset ride",
    width: 921,
    height: 2000,
  },
  {
    src: "/riding/r15-rain-ride.jpg",
    alt: "On tour.",
    caption: "On tour",
    width: 2000,
    height: 1334,
  },
  {
    src: "/riding/hill-road-ride.jpg",
    alt: "On tour.",
    caption: "On tour",
    width: 1828,
    height: 1370,
  },
  {
    src: "/riding/hilltop-sunset.jpg",
    alt: "Sunset ride.",
    caption: "Sunset ride",
    width: 2000,
    height: 1499,
  },
  {
    src: "/riding/highway-selfie-group.jpg",
    alt: "On tour.",
    caption: "On tour",
    width: 2000,
    height: 1497,
  },
];

/** Red t-shirt and scooter, seaside. Her Malaysia tour. */
export const malaysiaTourPhotos: RidePhoto[] = [
  {
    src: "/riding/scooter-seaside-1.jpg",
    alt: "Malaysia tour.",
    caption: "Malaysia tour",
    width: 1600,
    height: 1200,
  },
  {
    src: "/riding/scooter-seaside-2.jpg",
    alt: "Malaysia tour.",
    caption: "Malaysia tour",
    width: 1600,
    height: 1200,
  },
  {
    src: "/riding/scooter-seaside-portrait.jpg",
    alt: "Malaysia tour.",
    caption: "Malaysia tour",
    width: 1200,
    height: 1600,
  },
];

export const groupRidingPhotos: RidePhoto[] = [
  {
    src: "/riding/scooters-lineup-view.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 1600,
    height: 1200,
  },
  {
    src: "/riding/riders-gear-lineup.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 1600,
    height: 1200,
  },
  {
    src: "/riding/tour-group-lineup.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 2000,
    height: 1122,
  },
  {
    src: "/riding/tour-group-thumbs.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 2000,
    height: 1122,
  },
  {
    src: "/riding/tour-arms-together.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 1828,
    height: 1024,
  },
  {
    src: "/gallery/sajek.jpg",
    alt: "Group ride.",
    caption: "Group ride",
    width: 2048,
    height: 1510,
  },
];
