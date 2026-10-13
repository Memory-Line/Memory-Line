import Link from "next/link";
import {
  Activity, Accessibility, Armchair, Bed, BookOpen, Brain, Briefcase, Clock, Cloud, Church, Droplets, Ear, Flower2,
  Hand, Heart, HeartCrack, MapPin, Megaphone, MessageCircle, MoonStar, Moon, PartyPopper, PawPrint, Pill, Puzzle,
  RotateCw, Scale, Shield, Shirt, ShoppingBag, Smartphone, Sparkles, Stethoscope, Syringe, UserCheck, Users, Utensils,
  ArrowUpDown, Wind, type LucideIcon,
} from "lucide-react";

// One icon per topic of the talking boards.
const ICONS: Record<string, LucideIcon> = {
  "eating-and-drinking": Utensils,
  "toileting-and-continence": Droplets,
  "personal-care-and-hygiene": Sparkles,
  "pain-and-physical-health": Activity,
  "medicines-and-clinical-care": Pill,
  "mobility-and-positioning": Accessibility,
  "sleep-and-rest": Moon,
  "feelings-and-wellbeing": Heart,
  "orientation-memory-and-identity": Brain,
  "family-friends-and-visitors": Users,
  "activities-and-enjoyment": Puzzle,
  "faith-culture-and-identity": Church,
  "choice-consent-and-dignity": Scale,
  "safety-and-security": Shield,
  "comfort-and-surroundings": Armchair,
  "communication-support": MessageCircle,
  "daily-routine-and-time": Clock,
  "outings-and-community": MapPin,
  "comfort-and-end-of-life-care": Flower2,
  "belongings-money-and-home-life": Briefcase,
  "infection-control-and-ppe": Syringe,
  "who-is-helping-me": UserCheck,
  "hospital-and-appointments": Stethoscope,
  "technology-and-gadgets": Smartphone,
  "celebrations-and-seasons": PartyPopper,
  "care-in-bed-nursed-in-bed-or-bed-bound": Bed,
  "transfers-hoists-and-mobility-equipment": ArrowUpDown,
  "rolling-turning-and-pressure-care": RotateCw,
  "hearing-sight-and-senses": Ear,
  "dementia-distress-and-behaviour": Cloud,
  "life-story-and-what-matters-to-me": BookOpen,
  "breathing-heart-and-long-term-conditions": Wind,
  "skin-wounds-and-foot-care": Hand,
  "night-time-care": MoonStar,
  "staff-rights-and-feedback": Megaphone,
  "clothing-weather-and-seasons": Shirt,
  "pets-garden-and-nature": PawPrint,
  "money-shopping-and-post": ShoppingBag,
  "loss-grief-and-bereavement": HeartCrack,
};

const COLOURS = ["#4F7A45", "#3E6E96", "#A9741F", "#6A5A9A", "#A0507A", "#2F7A7C"];

export default function TopicTile({ href, slug, name, count, index }: { href: string; slug: string; name: string; count: number; index: number }) {
  const Icon = ICONS[slug] ?? MessageCircle;
  return (
    <Link href={href} className="block rounded-2xl p-3.5 text-white" style={{ background: COLOURS[index % COLOURS.length] }}>
      <div className="flex items-start justify-between">
        <Icon size={28} aria-hidden="true" />
        <span className="text-xs opacity-90">{count}</span>
      </div>
      <div className="text-[15px] font-semibold leading-snug mt-2">{name}</div>
    </Link>
  );
}
