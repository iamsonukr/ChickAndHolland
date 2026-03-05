"use client";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger
} from "@/components/ui/sheet";
import { toast } from "sonner";
import { zodResolver } from "@hookform/resolvers/zod";
import { Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import {
  AddProductColourForm,
  addProductColourFormSchema
} from "@/lib/formSchemas";
import useHttp from "@/lib/hooks/usePost";

const PREDEFINED_COLORS: Record<string, string> = {
  // Primary & Secondary (20)
  "Red": "#FF0000",
  "Blue": "#0000FF",
  "Green": "#00FF00",
  "Yellow": "#FFFF00",
  "Purple": "#800080",
  "Orange": "#FFA500",
  "Cyan": "#00FFFF",
  "Magenta": "#FF00FF",
  "Black": "#000000",
  "White": "#FFFFFF",
  "Brown": "#A52A2A",
  "Pink": "#FFC0CB",
  "Grey": "#808080",
  "Gold": "#FFD700",
  "Silver": "#C0C0C0",
  "Lime": "#00FF00",
  "Teal": "#008080",
  "Navy": "#000080",
  "Maroon": "#800000",
  "Olive": "#808000",

  // Red Spectrum (25)
  "Dark Red": "#8B0000",
  "Crimson": "#DC143C",
  "Fire Brick": "#B22222",
  "Indian Red": "#CD5C5C",
  "Salmon": "#FA8072",
  "Light Salmon": "#FFA07A",
  "Coral": "#FF7F50",
  "Tomato": "#FF6347",
  "Orange Red": "#FF4500",
  "Scarlet": "#FF2400",
  "Ruby": "#E0115F",
  "Burgundy": "#800020",
  "Carmine": "#960018",
  "Vermilion": "#E34234",
  "Mahogany": "#C04000",
  "Chestnut": "#954535",
  "Light Red": "#FFCCCB",
  "Rust": "#B7410E",
  "Cardinal": "#C41E3A",
  "Brick": "#8F1402",
  "Blood": "#660000",
  "Berry": "#990F4B",
  "Cherry": "#DE3163",
  "Garnet": "#733635",
  "Rosewood": "#65000B",

  // Pink Spectrum (20)
  "Hot Pink": "#FF69B4",
  "Deep Pink": "#FF1493",
  "Light Pink": "#FFB6C1",
  "Pale Violet Red": "#DB7093",
  "Medium Violet Red": "#C71585",
  "Fuchsia": "#FF00FF",
  "Orchid": "#DA70D6",
  "Violet": "#EE82EE",
  "Plum": "#DDA0DD",
  "Thistle": "#D8BFD8",
  "Lavender Blush": "#FFF0F5",
  "Misty Rose": "#FFE4E1",
  "Cerise": "#DE3163",
  "Rose": "#FF007F",
  "Watermelon": "#FC6C85",
  "Flamingo": "#FC8EAC",
  "Carnation": "#F95A61",
  "Bubble Gum": "#FFC1CC",
  "Blush": "#DE5D83",
  "Coral Pink": "#F88379",

  // Orange Spectrum (20)
  "Dark Orange": "#FF8C00",
  "Coral Orange": "#FF7F50",
  "Peach": "#FFE5B4",
  "Apricot": "#FBCEB1",
  "Melon": "#FDBCB4",
  "Burnt Orange": "#CC5500",
  "Pumpkin": "#FF7518",
  "Amber": "#FFBF00",
  "Tangerine": "#F28500",
  "Cantaloupe": "#FFA62F",
  "Mango": "#FFC324",
  "Papaya": "#FFEFD5",
  "Carrot": "#ED9121",
  "Terra Cotta": "#E2725B",
  "Copper": "#B87333",
  "Bronze": "#CD7F32",
  "Cinnamon": "#D2691E",
  "Ginger": "#B06500",
  "Honey": "#EB9605",
  "Persimmon": "#EC5800",

  // Yellow Spectrum (20)
  "Dark Yellow": "#FFCC00",
  "Lemon": "#FFF700",
  "Goldenrod": "#DAA520",
  "Pale Goldenrod": "#EEE8AA",
  "Khaki": "#F0E68C",
  "Dark Khaki": "#BDB76B",
  "Mustard": "#FFDB58",
  "Canary": "#FFFF99",
  "Banana": "#FFE135",
  "Daffodil": "#FFFF31",
  "Bumblebee": "#FCE205",
  "Flax": "#EEDC82",
  "Cream": "#FFFDD0",
  "Ivory": "#FFFFF0",
  "Beige": "#F5F5DC",
  "Corn": "#FBEC5D",
  "Sunflower": "#FFDA03",
  "Light Yellow": "#FFFFE0",
  "Straw": "#E4D96F",
  "Goldfinch": "#FDBD01",

  // Green Spectrum (30)
  "Dark Green": "#006400",
  "Lime Green": "#32CD32",
  "Forest Green": "#228B22",
  "Sea Green": "#2E8B57",
  "Medium Sea Green": "#3CB371",
  "Spring Green": "#00FF7F",
  "Mint": "#98FF98",
  "Emerald": "#50C878",
  "Jade": "#00A86B",
  "Olive Drab": "#6B8E23",
  "Chartreuse": "#7FFF00",
  "Kelly Green": "#4CBB17",
  "Sage": "#9CAF88",
  "Hunter Green": "#355E3B",
  "Fern": "#71BC78",
  "Shamrock": "#45CEA2",
  "Moss": "#8A9A5B",
  "Avocado": "#568203",
  "Pistachio": "#93C572",
  "Pear": "#D1E231",
  "Clover": "#3EA055",
  "Artichoke": "#8F9779",
  "Asparagus": "#87A96B",
  "Celadon": "#ACE1AF",
  "Neon Green": "#39FF14",
  "Army Green": "#4B5320",
  "Light Green": "#90EE90",
  "Parsley": "#1B4D3E",
  "Mint Cream": "#F5FFFA",
  "Viridian": "#40826D",

  // Blue Spectrum (35)
  "Dark Blue": "#00008B",
  "Sky Blue": "#87CEEB",
  "Deep Sky Blue": "#00BFFF",
  "Steel Blue": "#4682B4",
  "Royal Blue": "#4169E1",
  "Midnight Blue": "#191970",
  "Cornflower Blue": "#6495ED",
  "Dodger Blue": "#1E90FF",
  "Baby Blue": "#89CFF0",
  "Turquoise": "#40E0D0",
  "Aqua": "#00FFFF",
  "Aquamarine": "#7FFFD4",
  "Powder Blue": "#B0E0E6",
  "Ice Blue": "#99FFFF",
  "Slate Blue": "#6A5ACD",
  "Sapphire": "#0F52BA",
  "Azure": "#007FFF",
  "Cerulean": "#2A52BE",
  "Cobalt": "#0047AB",
  "Indigo": "#4B0082",
  "Periwinkle": "#CCCCFF",
  "Phthalo Blue": "#000F89",
  "Prussian Blue": "#003153",
  "Air Force Blue": "#5D8AA8",
  "Yale Blue": "#00356B",
  "Columbia Blue": "#B9D9EB",
  "Light Blue": "#ADD8E6",
  "Navy Blue": "#000080",
  "Peacock Blue": "#1CA9C9",
  "Saxe Blue": "#2E8B57",
  "Teal Blue": "#367588",
  "Federal Blue": "#00264F",
  "Space Blue": "#1D2951",
  "Denim": "#1560BD",
  "Sapphire Blue": "#0067A5",

  // Purple Spectrum (25)
  "Dark Purple": "#301934",
  "Lavender": "#E6E6FA",
  "Mauve": "#E0B0FF",
  "Lilac": "#C8A2C8",
  "Wisteria": "#C9A0DC",
  "Amethyst": "#9966CC",
  "Eggplant": "#614051",
  "Grape": "#6F2DA8",
  "Byzantium": "#702963",
  "Mulberry": "#C54B8C",
  "Heliotrope": "#DF73FF",
  "Iris": "#5A4FCF",
  "French Lilac": "#86608E",
  "Pansy": "#78184A",
  "Boysenberry": "#873260",
  "Rebecca Purple": "#663399",
  "Electric Purple": "#BF00FF",
  "Violet Blue": "#324AB2",
  "Light Purple": "#CBC3E3",
  "Orchid Purple": "#BA55D3",
  "Tyrian Purple": "#66023C",
  "Royal Purple": "#7851A9",
  "Mardi Gras": "#880085",
  "Passion Purple": "#682860",
  "Cyber Grape": "#58427C",

  // Brown Spectrum (25)
  "Dark Brown": "#654321",
  "Saddle Brown": "#8B4513",
  "Sienna": "#A0522D",
  "Chocolate": "#D2691E",
  "Peru": "#CD853F",
  "Sandy Brown": "#F4A460",
  "Burly Wood": "#DEB887",
  "Tan": "#D2B48C",
  "Rosy Brown": "#BC8F8F",
  "Mocha": "#967969",
  "Coffee": "#6F4E37",
  "Camel": "#C19A6B",
  "Almond": "#EFDECD",
  "Beaver": "#9F8170",
  "Umber": "#635147",
  "Taupe": "#483C32",
  "Cocoa": "#D2691E",
  "Hazel": "#8E7618",
  "Caramel": "#AF6E4D",
  "Toffee": "#755139",
  "Walnut": "#773F1A",
  "Pecan": "#A36E40",
  "Light Brown": "#C4A484",
  "Cinnamon Brown": "#D2691E",
  "Mahogany Brown": "#C04000",

  // Gray Spectrum (25)
  "Dark Gray": "#A9A9A9",
  "Dim Gray": "#696969",
  "Gainsboro": "#DCDCDC",
  "Smoke": "#848884",
  "Slate Gray": "#708090",
  "Charcoal": "#36454F",
  "Gunmetal": "#2C3539",
  "Ash": "#B2BEB5",
  "Platinum": "#E5E4E2",
  "Nickel": "#727472",
  "Iron": "#322D31",
  "Titanium": "#878681",
  "Aluminum": "#848789",
  "Shadow": "#837050",
  "Stone": "#928E85",
  "Pewter": "#899499",
  "Flint": "#6F6A61",
  "Light Gray": "#D3D3D3",
  "Battleship": "#848482",
  "Silver Sand": "#BFC1C2",
  "Ash Gray": "#B2BEB5",
  "Cool Gray": "#8C92AC",
  "Warm Gray": "#808080",
  "Timberwolf": "#DBD7D2",
  "Manatee": "#979AAA",

  // White Spectrum (20)
  "Snow": "#FFFAFA",
  "Honeydew": "#F0FFF0",
  "Azure White": "#F0FFFF",
  "Alice Blue": "#F0F8FF",
  "Ghost White": "#F8F8FF",
  "White Smoke": "#F5F5F5",
  "Seashell": "#FFF5EE",
  "Beige White": "#FAF0E6",
  "Old Lace": "#FDF5E6",
  "Floral White": "#FFFAF0",
  "Ivory White": "#FFFFF0",
  "Antique White": "#FAEBD7",
  "Champagne": "#F7E7CE",
  "Coconut": "#FFFDD0",
  "Pearl": "#FDEEF4",
  "Linen": "#FAF0E6",
  "Bone": "#E3DAC9",
  "Vanilla": "#F3E5AB",
  "Powder": "#FBF6F0",
  "Eggshell": "#F0EAD6",

  // Black Spectrum (15)
  "Jet Black": "#0A0A0A",
  "Ebony": "#555D50",
  "Onyx": "#353839",
  "Raven": "#6D787E",
  "Coal": "#0C0C0C",
  "Oil": "#3B3131",
  "Graphite": "#251607",
  "Obsidian": "#3D3D3F",
  "Black Olive": "#3B3C36",
  "Charcoal Black": "#1C1C1C",
  "Ink": "#252321",
  "Licorice": "#1A1110",
  "Panther": "#1C1C1C",
  "Iridium": "#3D3D3F",
  "Black Coffee": "#3B2F2F",

  // Neon Colors (20)
  "Neon Pink": "#FF6EC7",
  "Neon Blue": "#4D4DFF",
  "Neon Yellow": "#FFFF33",
  "Neon Orange": "#FF5F1F",
  "Neon Purple": "#BC13FE",
  "Electric Blue": "#7DF9FF",
  "Electric Lime": "#CCFF00",
  "Hot Magenta": "#FF00CC",
  "Cyber Yellow": "#FFD300",
  "Laser Lemon": "#FFFF66",
  "Atomic Tangerine": "#FF9966",
  "Radical Red": "#FF355E",
  "Wild Watermelon": "#FC6C85",
  "Outrageous Orange": "#FF6037",
  "Screamin' Green": "#66FF66",
  "Blizzard Blue": "#ACE5EE",
  "Magic Mint": "#AAF0D1",
  "Electric Green": "#00FF00",
  "Electric Cyan": "#00FFFF",
  "Neon Green": "#39FF14",

  // Pastel Colors (20)
  "Pastel Pink": "#FFD1DC",
  "Pastel Blue": "#AEC6CF",
  "Pastel Green": "#77DD77",
  "Pastel Yellow": "#FDFD96",
  "Pastel Purple": "#B39EB5",
  "Pastel Orange": "#FFB347",
  "Pastel Red": "#FF6961",
  "Pastel Violet": "#CB99C9",
  "Pastel Brown": "#836953",
  "Pastel Gray": "#CFCFC4",
  "Baby Pink": "#F4C2C2",
  "Baby Green": "#8CFF98",
  "Lavender Gray": "#C4C3D0",
  "Peach Puff": "#FFDAB9",
  "Powder Pink": "#FFB2D0",
  "Sky Blue Pastel": "#87CEEB",
  "Seafoam Green": "#93E9BE",
  "Lemon Chiffon": "#FFFACD",
  "Mint Green": "#98FB98",
  "Pale Turquoise": "#AFEEEE",

  // Earth Tones (20)
  "Terra Cotta": "#E2725B",
  "Sand": "#C2B280",
  "Clay": "#B66A50",
  "Mud": "#70543E",
  "Soil": "#8B7355",
  "Sandstone": "#C2B280",
  "Desert": "#FAD5A5",
  "Ochre": "#CC7722",
  "Sienna Earth": "#A0522D",
  "Umber Earth": "#635147",
  "Sepia": "#704214",
  "Khaki Earth": "#F0E68C",
  "Forest Earth": "#228B22",
  "Moss Earth": "#8A9A5B",
  "Sage Earth": "#9CAF88",
  "Pine": "#01796F",
  "Jungle": "#29AB87",
  "Evergreen": "#05472A",
  "Fern Earth": "#4F7942",
  "Cork": "#D1B59B",

  // Jewel Tones (20)
  "Ruby Red": "#E0115F",
  "Sapphire Blue": "#0F52BA",
  "Emerald Green": "#50C878",
  "Amethyst Purple": "#9966CC",
  "Topaz": "#FFC87C",
  "Opal": "#A8C3BC",
  "Pearl White": "#FDEEF4",
  "Diamond": "#B9F2FF",
  "Jade Green": "#00A86B",
  "Turquoise Jewel": "#30D5C8",
  "Lapis Lazuli": "#26619C",
  "Peridot": "#E6E200",
  "Moonstone": "#3AA8C1",
  "Citrine": "#E4D00A",
  "Amber Jewel": "#FFBF00",
  "Rose Quartz": "#F7CAC9",
  "Tanzanite": "#6A0DAD",
  "Aquamarine Jewel": "#7FFFD4",
  "Garnet Red": "#733635",
  "Onyx Black": "#353839",

  // Food & Spice Colors (30)
  "Strawberry": "#FC5A8D",
  "Blueberry": "#4F86F7",
  "Raspberry": "#E30B5D",
  "Blackberry": "#43182F",
  "Cranberry": "#DB5079",
  "Grapefruit": "#FD5956",
  "Pineapple": "#FFD700",
  "Kiwi": "#8EE53F",
  "Watermelon": "#FC6C85",
  "Honeydew": "#F0FFF0",
  "Pomegranate": "#660000",
  "Paprika": "#8B0000",
  "Saffron": "#F4C430",
  "Ketchup": "#C41230",
  "Maple": "#D38C5A",
  "Nutmeg": "#803A1B",
  "Clove": "#8E443D",
  "Wasabi": "#AFDB8D",
  "Matcha": "#9ABF5E",
  "Basil": "#32612D",
  "Oregano": "#7A9F5F",
  "Thyme": "#4F5D4F",
  "Rosemary": "#6F8F72",
  "Lavender Herb": "#B57EDC",
  "Chamomile": "#D8C762",
  "Earl Grey": "#A9957B",
  "Chili": "#C21807",
  "Papaya": "#FFEFD5",
  "Cantaloupe": "#FFA62F",
  "Berry": "#990F4B",

  // Sky & Weather Colors (20)
  "Cloud White": "#F4F4F4",
  "Storm Gray": "#6D6D6D",
  "Rain Gray": "#5D5D5D",
  "Thunder Purple": "#5D4B66",
  "Lightning Yellow": "#F5F5CC",
  "Sunrise Orange": "#FF7E5F",
  "Sunset Pink": "#FA8072",
  "Twilight Purple": "#4E387E",
  "Moonlight Silver": "#DADBDD",
  "Starlight Blue": "#A5D0E3",
  "Aurora Green": "#78C679",
  "Rainbow Red": "#FF0000",
  "Rainbow Orange": "#FF7F00",
  "Rainbow Blue": "#0000FF",
  "Rainbow Indigo": "#4B0082",
  "Rainbow Violet": "#8B00FF",
  "Fog Gray": "#DCDCDC",
  "Sunset Orange": "#FD5E53",
  "Dawn Pink": "#E6C9C9",
  "Storm Blue": "#4B6A88",

  // Ocean & Water Colors (20)
  "Ocean Blue": "#0077BE",
  "Sea Blue": "#006994",
  "Deep Ocean": "#005F6B",
  "Aqua Marine": "#7FFFD4",
  "Turquoise Sea": "#40E0D0",
  "Teal Ocean": "#008080",
  "Lagoon": "#01796F",
  "Seafoam": "#93E9BE",
  "Wave": "#C6E6FB",
  "Tidal": "#3EB489",
  "Marine": "#042E60",
  "Nautical": "#1A5091",
  "Sailor Blue": "#002366",
  "Pirate Black": "#0C090A",
  "Treasure Gold": "#FFD700",
  "Coral Reef": "#FD7C6E",
  "Seaweed": "#354A21",
  "Sand Beach": "#FAD5A5",
  "Shell Pink": "#FFD2C5",
  "Ocean Spray": "#B4D4E7",

  // Seasonal Colors (25)
  "Spring Green": "#00FF7F",
  "Spring Blossom": "#FFB7C5",
  "Spring Lilac": "#C8A2C8",
  "Spring Meadow": "#A7FC00",
  "Spring Rain": "#ECF3E6",
  "Summer Sky": "#38B0DE",
  "Summer Sun": "#FFDB00",
  "Summer Grass": "#5DA130",
  "Summer Berry": "#990012",
  "Summer Sand": "#E3C565",
  "Autumn Leaf": "#C154C1",
  "Autumn Orange": "#FF7518",
  "Autumn Brown": "#A0522D",
  "Autumn Gold": "#FFD700",
  "Pumpkin Spice": "#B1592A",
  "Harvest Gold": "#DA9100",
  "Fall Foliage": "#C55A11",
  "Winter White": "#F5F5F5",
  "Winter Blue": "#A0E6FF",
  "Winter Gray": "#8C92AC",
  "Winter Green": "#568203",
  "Winter Berry": "#990012",
  "Frost": "#E1F5FE",
  "Ice": "#D6FFFA",
  "Snowflake": "#E3F2FD",

  // Holiday Colors (15)
  "Christmas Red": "#B22222",
  "Christmas Green": "#228B22",
  "Christmas Gold": "#FFD700",
  "Christmas Silver": "#C0C0C0",
  "Valentine Pink": "#FF69B4",
  "Valentine Red": "#DC143C",
  "Halloween Orange": "#FF7518",
  "Halloween Purple": "#6A0DAD",
  "Easter Pink": "#FFB7C5",
  "Easter Yellow": "#FFFF99",
  "Easter Green": "#90EE90",
  "Easter Blue": "#ADD8E6",
  "Easter Purple": "#C8A2C8",
  "Thanksgiving Brown": "#8B4513",
  "New Year Gold": "#FFD700",

  // Metal & Industrial (20)
  "Gold Metal": "#D4AF37",
  "Silver Metal": "#C0C0C0",
  "Bronze Metal": "#CD7F32",
  "Copper Metal": "#B87333",
  "Platinum Metal": "#E5E4E2",
  "Brass": "#B5A642",
  "Steel Metal": "#4682B4",
  "Iron Metal": "#322D31",
  "Aluminum Metal": "#848789",
  "Titanium Metal": "#878681",
  "Nickel Metal": "#727472",
  "Chrome": "#E8F1F4",
  "Mercury": "#E5E5E5",
  "Lead": "#2D3842",
  "Zinc": "#BAC4C8",
  "Pewter Metal": "#899499",
  "Gunmetal": "#2C3539",
  "Rose Gold": "#B76E79",
  "White Gold": "#FFF6E9",
  "Black Steel": "#1C1C1C",

  // Retro & Vintage (15)
  "Retro Pink": "#FFB7C5",
  "Retro Blue": "#89CFF0",
  "Retro Green": "#90EE90",
  "Retro Yellow": "#FFFF99",
  "Vintage Rose": "#E8CCD7",
  "Vintage Teal": "#009B7D",
  "Vintage Mustard": "#FFDB58",
  "Vintage Burgundy": "#800020",
  "Mid Century Green": "#7C9D8E",
  "Mid Century Orange": "#E2725B",
  "Mid Century Yellow": "#F5DE50",
  "Mid Century Turquoise": "#40E0D0",
  "Art Deco Pink": "#E8C4C8",
  "Victorian Lavender": "#B695C0",
  "Retro Coral": "#FF7F50",

  // Fashion & Brand Colors (20)
  "Millennial Pink": "#F3CFC6",
  "Gen Z Yellow": "#F5DE50",
  "Tiffany Blue": "#81D8D0",
  "Hermes Orange": "#FF6600",
  "Louboutin Red": "#FF2400",
  "Chanel Black": "#000000",
  "Gucci Green": "#018749",
  "Prada Green": "#008C45",
  "Burberry Beige": "#C2B280",
  "Versace Gold": "#FFD700",
  "Dior Gray": "#D3D3D3",
  "Fendi Yellow": "#FFCC00",
  "Armani Silver": "#C0C0C0",
  "Cartier Red": "#B22222",
  "Rolex Green": "#006400",
  "Balenciaga Black": "#1A1A1A",
  "Vuitton Brown": "#825E2C",
  "Saint Laurent Black": "#000000",
  "Bottega Green": "#006400",
  "Moncler Blue": "#1E3A8A",

  // Technology Colors (20)
  "Apple Red": "#FF3B30",
  "Apple Blue": "#007AFF",
  "Apple Green": "#34C759",
  "Apple Yellow": "#FFCC00",
  "Google Red": "#EA4335",
  "Google Blue": "#4285F4",
  "Google Green": "#34A853",
  "Google Yellow": "#FBBC05",
  "Facebook Blue": "#1877F2",
  "Twitter Blue": "#1DA1F2",
  "Instagram Purple": "#E1306C",
  "YouTube Red": "#FF0000",
  "Microsoft Red": "#F25022",
  "Microsoft Green": "#7FBA00",
  "Microsoft Blue": "#00A4EF",
  "Microsoft Yellow": "#FFB900",
  "Amazon Orange": "#FF9900",
  "Netflix Red": "#E50914",
  "Spotify Green": "#1DB954",
  "TikTok Teal": "#69C9D0",

  // Cultural & Regional (15)
  "African Violet": "#B284BE",
  "Asian Gold": "#FFD700",
  "Caribbean Blue": "#1BE7FF",
  "Mediterranean Blue": "#0077BE",
  "Nordic Blue": "#1E3A8A",
  "Scandinavian White": "#FFFFFF",
  "Tropical Green": "#30D5C8",
  "Safari Tan": "#D2B48C",
  "Desert Sand": "#EDC9AF",
  "Mountain Gray": "#8C92AC",
  "Island Turquoise": "#40E0D0",
  "Greek Blue": "#0D5EAF",
  "Moroccan Red": "#B33B24",
  "Indian Saffron": "#FF9933",
  "Japanese Cherry": "#B28B9D",

  // Animal Colors (20)
  "Tiger Orange": "#F28C28",
  "Leopard Spots": "#B3896B",
  "Zebra Black": "#000000",
  "Zebra White": "#FFFFFF",
  "Elephant Gray": "#959595",
  "Giraffe Yellow": "#FCE205",
  "Lion Brown": "#A0522D",
  "Penguin Black": "#000000",
  "Penguin White": "#FFFFFF",
  "Flamingo Pink": "#FC8EAC",
  "Peacock Blue": "#1CA9C9",
  "Parrot Green": "#50C878",
  "Dolphin Gray": "#828282",
  "Whale Blue": "#1E3A8A",
  "Shark Gray": "#6D6D6D",
  "Turtle Green": "#2E8B57",
  "Frog Green": "#90EE90",
  "Butterfly Yellow": "#FDFD96",
  "Ladybug Red": "#A52A2A",
  "Bee Yellow": "#FFD300",

  // Gemstone Extended (20)
  "Alexandrite": "#617892",
  "Beryl": "#DCF2E6",
  "Bloodstone": "#660000",
  "Carnelian": "#B31B1B",
  "Chrysoprase": "#6ADA8E",
  "Hematite": "#5D5D5D",
  "Jasper": "#D73B3E",
  "Malachite": "#0BDA51",
  "Moonstone Blue": "#3AA8C1",
  "Obsidian Gem": "#3D3D3F",
  "Opal Fire": "#F7CAC9",
  "Peridot Green": "#E6E200",
  "Quartz": "#F5F5F5",
  "Ruby Gem": "#E0115F",
  "Sapphire Gem": "#0F52BA",
  "Topaz Blue": "#007FFF",
  "Tourmaline": "#8B8589",
  "Zircon": "#F4F4FF",
  "Spinel": "#C41E3A",
  "Kunzite": "#E198B4"
};

const AddProductColoursForm = () => {
  const [open, setOpen] = useState(false);
  const router = useRouter();

  const form = useForm<AddProductColourForm>({
    resolver: zodResolver(addProductColourFormSchema),
    defaultValues: {
      colours: [{ name: "", hexcode: "#000000" }]
    }
  });

  const { fields, append, remove } = useFieldArray({
    name: "colours",
    control: form.control
  });

  const { loading, executeAsync } = useHttp("/product-colours");

  const onSubmit = async (data: AddProductColourForm) => {
    try {
      const response = await executeAsync(data);
      form.reset();
      setOpen(false);
      toast.success(response.message ?? "Colors added successfully");
      router.refresh();
    } catch (error: any) {
      toast.error(error?.message ?? "Failed to add colors");
    }
  };

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button>
          Add New Colours <Plus className="ml-2" />
        </Button>
      </SheetTrigger>

      <SheetContent className="min-w-full md:min-w-[50%] lg:min-w-[35%] overflow-y-auto">
        <SheetHeader>
          <SheetTitle>Add New Colours</SheetTitle>
          <SheetDescription>Choose or search color name</SheetDescription>
        </SheetHeader>

        <Form {...form}>
          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="mt-6 space-y-6"
          >
            {fields.map((item, index) => {
              const colorName = form.watch(`colours.${index}.name`);
              const filtered = Object.keys(PREDEFINED_COLORS).filter((c) =>
                c.toLowerCase().includes(colorName.toLowerCase())
              );

              return (
                <div key={item.id} className="space-y-3 border-b pb-4">
                  {/* Color Name with Suggestions */}
                  <FormField
                    name={`colours.${index}.name`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Colour Name</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Search or type e.g. Red"
                            autoComplete="off"
                          />
                        </FormControl>

                        {/* Suggestions Dropdown */}
                        {filtered.length > 0 && colorName.length >= 1 && (
                          <div className="border rounded-md bg-white shadow-md mt-1 max-h-32 overflow-auto">
                            {filtered.map((c) => (
                              <button
                                key={c}
                                type="button"
                                className="flex items-center gap-2 px-3 py-1 w-full text-left hover:bg-gray-100"
                                onClick={() => {
                                  form.setValue(`colours.${index}.name`, c);
                                  form.setValue(
                                    `colours.${index}.hexcode`,
                                    PREDEFINED_COLORS[c]
                                  );
                                }}
                              >
                                <span
                                  className="w-4 h-4 rounded-full"
                                  style={{ backgroundColor: PREDEFINED_COLORS[c] }}
                                />
                                {c}
                              </button>
                            ))}
                          </div>
                        )}

                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Color Picker with Live Preview */}
                  <FormField
                    name={`colours.${index}.hexcode`}
                    control={form.control}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Pick Colour</FormLabel>
                        <div className="flex items-center gap-4">
                          <FormControl>
                            <Input type="color" className="cursor-pointer h-10" {...field} />
                          </FormControl>

                          <div
                            className="w-10 h-10 rounded-full border shadow-sm"
                            style={{ backgroundColor: field.value }}
                          ></div>
                        </div>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {index > 0 && (
                    <Button variant="destructive" type="button" onClick={() => remove(index)}>
                      Remove Colour
                    </Button>
                  )}
                </div>
              );
            })}

            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => append({ name: "", hexcode: "#000000" })}
            >
              Add Another Colour
            </Button>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Saving..." : "Save Colours"}
            </Button>
          </form>
        </Form>
      </SheetContent>
    </Sheet>
  );
};

export default AddProductColoursForm;

// "use client";

// import { Button } from "@/components/ui/button";
// import {
//   Form,
//   FormControl,
//   FormField,
//   FormItem,
//   FormLabel,
//   FormMessage
// } from "@/components/ui/form";
// import { Input } from "@/components/ui/input";
// import {
//   Sheet,
//   SheetContent,
//   SheetDescription,
//   SheetHeader,
//   SheetTitle,
//   SheetTrigger
// } from "@/components/ui/sheet";
// import { toast } from "sonner";
// import { zodResolver } from "@hookform/resolvers/zod";
// import { 
//   Plus, 
//   Palette, 
//   Copy, 
//   X, 
//   Clock, 
//   Star, 
//   Check, 
//   Sparkles 
// } from "lucide-react";
// import { useRouter } from "next/navigation";
// import { useState } from "react";
// import { useForm, useFieldArray } from "react-hook-form";
// import {
//   AddProductColourForm,
//   addProductColourFormSchema
// } from "@/lib/formSchemas";
// import useHttp from "@/lib/hooks/usePost";

// const PREDEFINED_COLORS: Record<string, string> = {
//   // Basic colors
//   Red: "#FF0000",
//   Blue: "#0000FF",
//   Green: "#00FF00",
//   Yellow: "#FFFF00",
//   Black: "#000000",
//   White: "#FFFFFF",
//   Pink: "#FFC0CB",
//   Purple: "#800080",
//   Orange: "#FFA500",
//   Brown: "#A52A2A",
//   Grey: "#808080",
//   Silver: "#C0C0C0",
//   Gold: "#FFD700",
  
//   // Red variations
//   "Light Red": "#FFCCCB",
//   "Dark Red": "#8B0000",
//   "Crimson": "#DC143C",
//   "Fire Brick": "#B22222",
//   "Indian Red": "#CD5C5C",
//   "Salmon": "#FA8072",
//   "Light Salmon": "#FFA07A",
//   "Coral": "#FF7F50",
//   "Tomato": "#FF6347",
//   "Orange Red": "#FF4500",
//   "Maroon": "#800000",
//   "Scarlet": "#FF2400",
//   "Ruby": "#E0115F",
//   "Crimson Red": "#990000",
//   "Burgundy": "#800020",
//   "Carmine": "#960018",
//   "Vermilion": "#E34234",
//   "Rust": "#B7410E",
//   "Mahogany": "#C04000",
//   "Chestnut": "#954535",
  
//   // Pink variations
//   "Light Pink": "#FFB6C1",
//   "Hot Pink": "#FF69B4",
//   "Deep Pink": "#FF1493",
//   "Pale Violet Red": "#DB7093",
//   "Medium Violet Red": "#C71585",
//   "Fuchsia": "#FF00FF",
//   "Magenta": "#FF00FF",
//   "Orchid": "#DA70D6",
//   "Violet": "#EE82EE",
//   "Plum": "#DDA0DD",
//   "Thistle": "#D8BFD8",
//   "Lavender Blush": "#FFF0F5",
//   "Misty Rose": "#FFE4E1",
//   "Raspberry": "#E30B5D",
//   "Cerise": "#DE3163",
//   "Rose": "#FF007F",
//   "Watermelon": "#FC6C85",
//   "Flamingo": "#FC8EAC",
//   "Carnation": "#F95A61",
//   "Bubble Gum": "#FFC1CC",
  
//   // Orange variations
//   "Light Orange": "#FFD580",
//   "Dark Orange": "#FF8C00",
//   "Coral Orange": "#FF7F50",
//   "Peach": "#FFE5B4",
//   "Apricot": "#FBCEB1",
//   "Melon": "#FDBCB4",
//   "Burnt Orange": "#CC5500",
//   "Pumpkin": "#FF7518",
//   "Amber": "#FFBF00",
//   "Tangerine": "#F28500",
//   "Cantaloupe": "#FFA62F",
//   "Mango": "#FFC324",
//   "Papaya": "#FFEFD5",
//   "Carrot": "#ED9121",
//   "Terra Cotta": "#E2725B",
//   "Copper": "#B87333",
//   "Bronze": "#CD7F32",
//   "Cinnamon": "#D2691E",
//   "Ginger": "#B06500",
//   "Honey": "#EB9605",
  
//   // Yellow variations
//   "Light Yellow": "#FFFFE0",
//   "Dark Yellow": "#FFCC00",
//   "Lemon": "#FFF700",
//   "Gold": "#FFD700",
//   "Goldenrod": "#DAA520",
//   "Pale Goldenrod": "#EEE8AA",
//   "Khaki": "#F0E68C",
//   "Dark Khaki": "#BDB76B",
//   "Mustard": "#FFDB58",
//   "Canary": "#FFFF99",
//   "Banana": "#FFE135",
//   "Daffodil": "#FFFF31",
//   "Bumblebee": "#FCE205",
//   "Straw": "#E4D96F",
//   "Flax": "#EEDC82",
//   "Cream": "#FFFDD0",
//   "Ivory": "#FFFFF0",
//   "Beige": "#F5F5DC",
//   "Corn": "#FBEC5D",
//   "Sunflower": "#FFDA03",
  
//   // Green variations
//   "Light Green": "#90EE90",
//   "Dark Green": "#006400",
//   "Lime": "#00FF00",
//   "Lime Green": "#32CD32",
//   "Forest Green": "#228B22",
//   "Sea Green": "#2E8B57",
//   "Medium Sea Green": "#3CB371",
//   "Spring Green": "#00FF7F",
//   "Mint": "#98FF98",
//   "Emerald": "#50C878",
//   "Jade": "#00A86B",
//   "Olive": "#808000",
//   "Olive Drab": "#6B8E23",
//   "Chartreuse": "#7FFF00",
//   "Kelly Green": "#4CBB17",
//   "Sage": "#9CAF88",
//   "Hunter Green": "#355E3B",
//   "Fern": "#71BC78",
//   "Shamrock": "#45CEA2",
//   "Moss": "#8A9A5B",
//   "Avocado": "#568203",
//   "Pistachio": "#93C572",
//   "Pear": "#D1E231",
//   "Limeade": "#6F9D02",
//   "Clover": "#3EA055",
//   "Artichoke": "#8F9779",
//   "Asparagus": "#87A96B",
//   "Celadon": "#ACE1AF",
//   "Neon Green": "#39FF14",
//   "Army Green": "#4B5320",
  
//   // Blue variations
//   "Light Blue": "#ADD8E6",
//   "Dark Blue": "#00008B",
//   "Sky Blue": "#87CEEB",
//   "Deep Sky Blue": "#00BFFF",
//   "Steel Blue": "#4682B4",
//   "Royal Blue": "#4169E1",
//   "Navy": "#000080",
//   "Midnight Blue": "#191970",
//   "Cornflower Blue": "#6495ED",
//   "Dodger Blue": "#1E90FF",
//   "Baby Blue": "#89CFF0",
//   "Turquoise": "#40E0D0",
//   "Cyan": "#00FFFF",
//   "Aqua": "#00FFFF",
//   "Teal": "#008080",
//   "Aquamarine": "#7FFFD4",
//   "Powder Blue": "#B0E0E6",
//   "Ice Blue": "#99FFFF",
//   "Slate Blue": "#6A5ACD",
//   "Sapphire": "#0F52BA",
//   "Azure": "#007FFF",
//   "Cerulean": "#2A52BE",
//   "Cobalt": "#0047AB",
//   "Indigo": "#4B0082",
//   "Periwinkle": "#CCCCFF",
//   "Phthalo Blue": "#000F89",
//   "Prussian Blue": "#003153",
//   "Air Force Blue": "#5D8AA8",
//   "Yale Blue": "#00356B",
//   "UCLA Blue": "#536895",
//   "Columbia Blue": "#B9D9EB",
  
//   // Purple variations
//   "Light Purple": "#CBC3E3",
//   "Dark Purple": "#301934",
//   "Lavender": "#E6E6FA",
//   "Mauve": "#E0B0FF",
//   "Lilac": "#C8A2C8",
//   "Wisteria": "#C9A0DC",
//   "Amethyst": "#9966CC",
//   "Eggplant": "#614051",
//   "Grape": "#6F2DA8",
//   "Byzantium": "#702963",
//   "Mulberry": "#C54B8C",
//   "Orchid Purple": "#BA55D3",
//   "Heliotrope": "#DF73FF",
//   "Iris": "#5A4FCF",
//   "French Lilac": "#86608E",
//   "Pansy": "#78184A",
//   "Boysenberry": "#873260",
//   "Rebecca Purple": "#663399",
//   "Electric Purple": "#BF00FF",
//   "Violet Blue": "#324AB2",
  
//   // Brown variations
//   "Light Brown": "#C4A484",
//   "Dark Brown": "#654321",
//   "Saddle Brown": "#8B4513",
//   "Sienna": "#A0522D",
//   "Chocolate": "#D2691E",
//   "Peru": "#CD853F",
//   "Sandy Brown": "#F4A460",
//   "Burly Wood": "#DEB887",
//   "Tan": "#D2B48C",
//   "Rosy Brown": "#BC8F8F",
//   "Mocha": "#967969",
//   "Coffee": "#6F4E37",
//   "Camel": "#C19A6B",
//   "Almond": "#EFDECD",
//   "Beaver": "#9F8170",
//   "Umber": "#635147",
//   "Taupe": "#483C32",
//   "Khaki Brown": "#F0E68C",
//   "Cocoa": "#D2691E",
//   "Cinnamon Brown": "#D2691E",
//   "Hazel": "#8E7618",
//   "Caramel": "#AF6E4D",
//   "Toffee": "#755139",
//   "Mahogany Brown": "#C04000",
//   "Walnut": "#773F1A",
//   "Pecan": "#A36E40",
  
//   // Gray variations
//   "Light Gray": "#D3D3D3",
//   "Dark Gray": "#A9A9A9",
//   "Dim Gray": "#696969",
//   "Gainsboro": "#DCDCDC",
//   "Silver": "#C0C0C0",
//   "Smoke": "#848884",
//   "Slate Gray": "#708090",
//   "Charcoal": "#36454F",
//   "Gunmetal": "#2C3539",
//   "Ash": "#B2BEB5",
//   "Platinum": "#E5E4E2",
//   "Nickel": "#727472",
//   "Iron": "#322D31",
//   "Titanium": "#878681",
//   "Aluminum": "#848789",
//   "Steel": "#4682B4",
//   "Shadow": "#837050",
//   "Stone": "#928E85",
//   "Pewter": "#899499",
//   "Flint": "#6F6A61",
  
//   // White variations
//   "Snow": "#FFFAFA",
//   "Honeydew": "#F0FFF0",
//   "Mint Cream": "#F5FFFA",
//   "Azure White": "#F0FFFF",
//   "Alice Blue": "#F0F8FF",
//   "Ghost White": "#F8F8FF",
//   "White Smoke": "#F5F5F5",
//   "Seashell": "#FFF5EE",
//   "Beige White": "#FAF0E6",
//   "Old Lace": "#FDF5E6",
//   "Floral White": "#FFFAF0",
//   "Ivory White": "#FFFFF0",
//   "Antique White": "#FAEBD7",
//   "Champagne": "#F7E7CE",
//   "Coconut": "#FFFDD0",
//   "Pearl": "#FDEEF4",
//   "Linen": "#FAF0E6",
//   "Bone": "#E3DAC9",
//   "Vanilla": "#F3E5AB",
//   "Powder": "#FBF6F0",
  
//   // Black variations
//   "Jet Black": "#0A0A0A",
//   "Ebony": "#555D50",
//   "Onyx": "#353839",
//   "Raven": "#6D787E",
//   "Coal": "#0C0C0C",
//   "Oil": "#3B3131",
//   "Graphite": "#251607",
//   "Obsidian": "#3D3D3F",
//   "Black Olive": "#3B3C36",
//   "Charcoal Black": "#1C1C1C",
//   "Midnight": "#2B1B17",
//   "Ink": "#252321",
//   "Licorice": "#1A1110",
//   "Panther": "#1C1C1C",
//   "Crow": "#0D0D0D",
//   "Black Bean": "#3D0C02",
//   "Black Leather": "#253529",
//   "Black Cat": "#413839",
//   "Iridium": "#3D3D3F",
//   "Black Coffee": "#3B2F2F",
  
//   // Special/Neon colors
//   "Neon Pink": "#FF6EC7",
//   "Neon Blue": "#4D4DFF",
//   "Neon Green": "#39FF14",
//   "Neon Yellow": "#FFFF33",
//   "Neon Orange": "#FF5F1F",
//   "Neon Purple": "#BC13FE",
//   "Electric Blue": "#7DF9FF",
//   "Electric Green": "#00FF00",
//   "Electric Lime": "#CCFF00",
//   "Electric Cyan": "#00FFFF",
//   "Hot Magenta": "#FF00CC",
//   "Cyber Yellow": "#FFD300",
//   "Laser Lemon": "#FFFF66",
//   "Atomic Tangerine": "#FF9966",
//   "Radical Red": "#FF355E",
//   "Wild Watermelon": "#FC6C85",
//   "Outrageous Orange": "#FF6037",
//   "Screamin' Green": "#66FF66",
//   "Blizzard Blue": "#ACE5EE",
//   "Magic Mint": "#AAF0D1",
  
//   // Pastel colors
//   "Pastel Pink": "#FFD1DC",
//   "Pastel Blue": "#AEC6CF",
//   "Pastel Green": "#77DD77",
//   "Pastel Yellow": "#FDFD96",
//   "Pastel Purple": "#B39EB5",
//   "Pastel Orange": "#FFB347",
//   "Pastel Red": "#FF6961",
//   "Pastel Violet": "#CB99C9",
//   "Pastel Brown": "#836953",
//   "Pastel Gray": "#CFCFC4",
//   "Baby Pink": "#F4C2C2",
//   "Baby Blue": "#89CFF0",
//   "Baby Green": "#8CFF98",
//   "Lavender Gray": "#C4C3D0",
//   "Mint Green": "#98FB98",
//   "Peach Puff": "#FFDAB9",
//   "Powder Pink": "#FFB2D0",
//   "Sky Blue Pastel": "#87CEEB",
//   "Seafoam Green": "#93E9BE",
//   "Lemon Chiffon": "#FFFACD",
  
//   // Earth tones
//   "Terra Cotta": "#E2725B",
//   "Sand": "#C2B280",
//   "Clay": "#B66A50",
//   "Mud": "#70543E",
//   "Soil": "#8B7355",
//   "Sandstone": "#C2B280",
//   "Desert": "#FAD5A5",
//   "Ochre": "#CC7722",
//   "Sienna Earth": "#A0522D",
//   "Umber Earth": "#635147",
//   "Sepia": "#704214",
//   "Khaki Earth": "#F0E68C",
//   "Olive Drab Earth": "#6B8E23",
//   "Forest Earth": "#228B22",
//   "Moss Earth": "#8A9A5B",
//   "Sage Earth": "#9CAF88",
//   "Pine": "#01796F",
//   "Jungle": "#29AB87",
//   "Evergreen": "#05472A",
//   "Fern Earth": "#4F7942",
  
//   // Jewel tones
//   "Ruby Red": "#E0115F",
//   "Sapphire Blue": "#0F52BA",
//   "Emerald Green": "#50C878",
//   "Amethyst Purple": "#9966CC",
//   "Topaz": "#FFC87C",
//   "Opal": "#A8C3BC",
//   "Pearl White": "#FDEEF4",
//   "Diamond": "#B9F2FF",
//   "Garnet": "#733635",
//   "Jade Green": "#00A86B",
//   "Turquoise Jewel": "#30D5C8",
//   "Lapis Lazuli": "#26619C",
//   "Peridot": "#E6E200",
//   "Aquamarine Jewel": "#7FFFD4",
//   "Moonstone": "#3AA8C1",
//   "Onyx Black": "#353839",
//   "Citrine": "#E4D00A",
//   "Amber Jewel": "#FFBF00",
//   "Rose Quartz": "#F7CAC9",
//   "Tanzanite": "#6A0DAD",
  
//   // Food colors
//   "Cherry": "#DE3163",
//   "Strawberry": "#FC5A8D",
//   "Blueberry": "#4F86F7",
//   "Raspberry": "#E30B5D",
//   "Blackberry": "#43182F",
//   "Cranberry": "#DB5079",
//   "Grapefruit": "#FD5956",
//   "Lemon": "#FFF700",
//   "Lime": "#00FF00",
//   "Orange": "#FFA500",
//   "Peach": "#FFE5B4",
//   "Banana": "#FFE135",
//   "Pineapple": "#FFD700",
//   "Mango": "#FFC324",
//   "Kiwi": "#8EE53F",
//   "Watermelon": "#FC6C85",
//   "Cantaloupe": "#FFA62F",
//   "Honeydew": "#F0FFF0",
//   "Pomegranate": "#660000",
//   "Avocado": "#568203",
//   "Eggplant": "#614051",
//   "Olive": "#808000",
//   "Carrot": "#ED9121",
//   "Tomato": "#FF6347",
//   "Chili": "#C21807",
//   "Paprika": "#8B0000",
//   "Saffron": "#F4C430",
//   "Mustard": "#FFDB58",
//   "Ketchup": "#C41230",
//   "Chocolate": "#D2691E",
//   "Caramel": "#AF6E4D",
//   "Coffee": "#6F4E37",
//   "Tea": "#B5651D",
//   "Milk": "#FDFFF5",
//   "Honey": "#EB9605",
//   "Maple": "#D38C5A",
//   "Vanilla": "#F3E5AB",
//   "Cinnamon": "#D2691E",
//   "Nutmeg": "#803A1B",
//   "Clove": "#8E443D",
//   "Ginger": "#B06500",
//   "Wasabi": "#AFDB8D",
//   "Matcha": "#9ABF5E",
//   "Mint": "#98FF98",
//   "Basil": "#32612D",
//   "Oregano": "#7A9F5F",
//   "Parsley": "#1B4D3E",
//   "Sage Herb": "#87A96B",
//   "Thyme": "#4F5D4F",
//   "Rosemary": "#6F8F72",
//   "Lavender Herb": "#B57EDC",
//   "Chamomile": "#D8C762",
//   "Earl Grey": "#A9957B",
  
//   // Sky/Weather colors
//   "Sky Blue": "#87CEEB",
//   "Cloud White": "#F4F4F4",
//   "Storm Gray": "#6D6D6D",
//   "Rain Gray": "#5D5D5D",
//   "Thunder Purple": "#5D4B66",
//   "Lightning Yellow": "#F5F5CC",
//   "Sunrise Orange": "#FF7E5F",
//   "Sunset Pink": "#FA8072",
//   "Twilight Purple": "#4E387E",
//   "Moonlight Silver": "#DADBDD",
//   "Starlight Blue": "#A5D0E3",
//   "Aurora Green": "#78C679",
//   "Rainbow Red": "#FF0000",
//   "Rainbow Orange": "#FF7F00",
//   "Rainbow Yellow": "#FFFF00",
//   "Rainbow Green": "#00FF00",
//   "Rainbow Blue": "#0000FF",
//   "Rainbow Indigo": "#4B0082",
//   "Rainbow Violet": "#8B00FF",
//   "Fog Gray": "#DCDCDC",
  
//   // Ocean/Water colors
//   "Ocean Blue": "#0077BE",
//   "Sea Blue": "#006994",
//   "Deep Ocean": "#005F6B",
//   "Aqua Marine": "#7FFFD4",
//   "Turquoise Sea": "#40E0D0",
//   "Teal Ocean": "#008080",
//   "Lagoon": "#01796F",
//   "Seafoam": "#93E9BE",
//   "Wave": "#C6E6FB",
//   "Tidal": "#3EB489",
//   "Marine": "#042E60",
//   "Nautical": "#1A5091",
//   "Sailor Blue": "#002366",
//   "Pirate Black": "#0C090A",
//   "Treasure Gold": "#FFD700",
//   "Pearl White": "#FDEEF4",
//   "Coral Reef": "#FD7C6E",
//   "Seaweed": "#354A21",
//   "Sand Beach": "#FAD5A5",
//   "Shell Pink": "#FFD2C5",
  
//   // Seasonal colors
//   // Spring
//   "Spring Green": "#00FF7F",
//   "Spring Blossom": "#FFB7C5",
//   "Spring Lilac": "#C8A2C8",
//   "Spring Meadow": "#A7FC00",
//   "Spring Rain": "#ECF3E6",
  
//   // Summer
//   "Summer Sky": "#38B0DE",
//   "Summer Sun": "#FFDB00",
//   "Summer Grass": "#5DA130",
//   "Summer Berry": "#990012",
//   "Summer Sand": "#E3C565",
  
//   // Autumn/Fall
//   "Autumn Leaf": "#C154C1",
//   "Autumn Orange": "#FF7518",
//   "Autumn Brown": "#A0522D",
//   "Autumn Gold": "#FFD700",
//   "Autumn Red": "#8B0000",
//   "Pumpkin Spice": "#B1592A",
//   "Harvest Gold": "#DA9100",
//   "Fall Foliage": "#C55A11",
  
//   // Winter
//   "Winter White": "#F5F5F5",
//   "Winter Blue": "#A0E6FF",
//   "Winter Gray": "#8C92AC",
//   "Winter Green": "#568203",
//   "Winter Berry": "#990012",
//   "Frost": "#E1F5FE",
//   "Ice": "#D6FFFA",
//   "Snowflake": "#E3F2FD",
  
//   // Holiday colors
//   "Christmas Red": "#B22222",
//   "Christmas Green": "#228B22",
//   "Christmas Gold": "#FFD700",
//   "Christmas Silver": "#C0C0C0",
//   "Valentine Pink": "#FF69B4",
//   "Valentine Red": "#DC143C",
//   "Halloween Orange": "#FF7518",
//   "Halloween Purple": "#6A0DAD",
//   "Halloween Black": "#000000",
//   "Easter Pink": "#FFB7C5",
//   "Easter Yellow": "#FFFF99",
//   "Easter Green": "#90EE90",
//   "Easter Blue": "#ADD8E6",
//   "Easter Purple": "#C8A2C8",
  
//   // Metal colors
//   "Gold Metal": "#D4AF37",
//   "Silver Metal": "#C0C0C0",
//   "Bronze Metal": "#CD7F32",
//   "Copper Metal": "#B87333",
//   "Platinum Metal": "#E5E4E2",
//   "Brass": "#B5A642",
//   "Steel Metal": "#4682B4",
//   "Iron Metal": "#322D31",
//   "Aluminum Metal": "#848789",
//   "Titanium Metal": "#878681",
//   "Nickel Metal": "#727472",
//   "Chrome": "#E8F1F4",
//   "Mercury": "#E5E5E5",
//   "Lead": "#2D3842",
//   "Zinc": "#BAC4C8",
//   "Pewter Metal": "#899499",
//   "Gunmetal": "#2C3539",
  
//   // Retro/Vintage colors
//   "Retro Pink": "#FFB7C5",
//   "Retro Blue": "#89CFF0",
//   "Retro Green": "#90EE90",
//   "Retro Yellow": "#FFFF99",
//   "Retro Orange": "#FFA500",
//   "Vintage Rose": "#E8CCD7",
//   "Vintage Teal": "#009B7D",
//   "Vintage Mustard": "#FFDB58",
//   "Vintage Burgundy": "#800020",
//   "Vintage Olive": "#808000",
//   "Mid Century Green": "#7C9D8E",
//   "Mid Century Orange": "#E2725B",
//   "Mid Century Yellow": "#F5DE50",
//   "Mid Century Turquoise": "#40E0D0",
//   "Mid Century Brown": "#8B7355",
  
//   // Fashion colors
//   "Millennial Pink": "#F3CFC6",
//   "Gen Z Yellow": "#F5DE50",
//   "Tiffany Blue": "#81D8D0",
//   "Hermes Orange": "#FF6600",
//   "Louboutin Red": "#FF2400",
//   "Chanel Black": "#000000",
//   "Gucci Green": "#018749",
//   "Prada Green": "#008C45",
//   "Burberry Beige": "#C2B280",
//   "Versace Gold": "#FFD700",
//   "Dior Gray": "#D3D3D3",
//   "Fendi Yellow": "#FFCC00",
//   "Armani Silver": "#C0C0C0",
//   "Cartier Red": "#B22222",
//   "Rolex Green": "#006400",
  
//   // Technology colors
//   "Apple Red": "#FF3B30",
//   "Apple Blue": "#007AFF",
//   "Apple Green": "#34C759",
//   "Apple Yellow": "#FFCC00",
//   "Google Red": "#EA4335",
//   "Google Blue": "#4285F4",
//   "Google Green": "#34A853",
//   "Google Yellow": "#FBBC05",
//   "Facebook Blue": "#1877F2",
//   "Twitter Blue": "#1DA1F2",
//   "Instagram Purple": "#E1306C",
//   "YouTube Red": "#FF0000",
//   "Microsoft Red": "#F25022",
//   "Microsoft Green": "#7FBA00",
//   "Microsoft Blue": "#00A4EF",
//   "Microsoft Yellow": "#FFB900",
//   "Amazon Orange": "#FF9900",
//   "Netflix Red": "#E50914",
//   "Spotify Green": "#1DB954",
//   "TikTok Teal": "#69C9D0",
  
//   // Cultural/Regional colors
//   "African Violet": "#B284BE",
//   "Asian Gold": "#FFD700",
//   "Caribbean Blue": "#1BE7FF",
//   "Mediterranean Blue": "#0077BE",
//   "Nordic Blue": "#1E3A8A",
//   "Scandinavian White": "#FFFFFF",
//   "Tropical Green": "#30D5C8",
//   "Safari Tan": "#D2B48C",
//   "Desert Sand": "#EDC9AF",
//   "Mountain Gray": "#8C92AC",
//   "Forest Green": "#228B22",
//   "Ocean Blue": "#0077BE",
//   "Island Turquoise": "#40E0D0",
//   "Beach Sand": "#FAD5A5",
//   "Sunset Orange": "#FD5E53",
  
//   // Animal colors
//   "Tiger Orange": "#F28C28",
//   "Leopard Spots": "#B3896B",
//   "Zebra Black": "#000000",
//   "Zebra White": "#FFFFFF",
//   "Elephant Gray": "#959595",
//   "Giraffe Yellow": "#FCE205",
//   "Lion Brown": "#A0522D",
//   "Penguin Black": "#000000",
//   "Penguin White": "#FFFFFF",
//   "Flamingo Pink": "#FC8EAC",
//   "Peacock Blue": "#1CA9C9",
//   "Parrot Green": "#50C878",
//   "Dolphin Gray": "#828282",
//   "Whale Blue": "#1E3A8A",
//   "Shark Gray": "#6D6D6D",
//   "Turtle Green": "#2E8B57",
//   "Frog Green": "#90EE90",
//   "Butterfly Yellow": "#FDFD96",
//   "Ladybug Red": "#A52A2A",
//   "Bee Yellow": "#FFD300",
  
//   // Gemstone colors (additional)
//   "Alexandrite": "#617892",
//   "Aquamarine Gem": "#7FFFD4",
//   "Beryl": "#DCF2E6",
//   "Bloodstone": "#660000",
//   "Carnelian": "#B31B1B",
//   "Chrysoprase": "#6ADA8E",
//   "Citrine Gem": "#E4D00A",
//   "Diamond Blue": "#B9F2FF",
//   "Hematite": "#5D5D5D",
//   "Jasper": "#D73B3E",
//   "Malachite": "#0BDA51",
//   "Moonstone Blue": "#3AA8C1",
//   "Obsidian Gem": "#3D3D3F",
//   "Onyx Gem": "#353839",
//   "Opal Fire": "#F7CAC9",
//   "Pearl Gem": "#FDEEF4",
//   "Peridot Green": "#E6E200",
//   "Quartz": "#F5F5F5",
//   "Ruby Gem": "#E0115F",
//   "Sapphire Gem": "#0F52BA",
//   "Topaz Blue": "#007FFF",
//   "Tourmaline": "#8B8589",
//   "Turquoise Gem": "#30D5C8",
//   "Zircon": "#F4F4FF"
// };

// // Helper function to generate color harmonies
// const generateColorHarmony = (baseColor: string): string[] => {
//   if (!baseColor || !baseColor.startsWith('#')) return [];
  
//   const hex = baseColor.slice(1);
//   const r = parseInt(hex.slice(0, 2), 16);
//   const g = parseInt(hex.slice(2, 4), 16);
//   const b = parseInt(hex.slice(4, 6), 16);
  
//   // Generate complementary color
//   const compR = 255 - r;
//   const compG = 255 - g;
//   const compB = 255 - b;
  
//   // Generate analogous colors (30° apart)
//   const hsl = rgbToHsl(r, g, b);
//   const analogous1 = hslToRgb((hsl[0] + 30) % 360, hsl[1], hsl[2]);
//   const analogous2 = hslToRgb((hsl[0] + 330) % 360, hsl[1], hsl[2]);
  
//   // Generate triadic colors
//   const triadic1 = hslToRgb((hsl[0] + 120) % 360, hsl[1], hsl[2]);
//   const triadic2 = hslToRgb((hsl[0] + 240) % 360, hsl[1], hsl[2]);
  
//   return [
//     baseColor,
//     `#${compR.toString(16).padStart(2, '0')}${compG.toString(16).padStart(2, '0')}${compB.toString(16).padStart(2, '0')}`,
//     `#${analogous1[0].toString(16).padStart(2, '0')}${analogous1[1].toString(16).padStart(2, '0')}${analogous1[2].toString(16).padStart(2, '0')}`,
//     `#${analogous2[0].toString(16).padStart(2, '0')}${analogous2[1].toString(16).padStart(2, '0')}${analogous2[2].toString(16).padStart(2, '0')}`,
//     `#${triadic1[0].toString(16).padStart(2, '0')}${triadic1[1].toString(16).padStart(2, '0')}${triadic1[2].toString(16).padStart(2, '0')}`,
//   ];
// };

// // RGB to HSL conversion
// const rgbToHsl = (r: number, g: number, b: number): [number, number, number] => {
//   r /= 255;
//   g /= 255;
//   b /= 255;
  
//   const max = Math.max(r, g, b);
//   const min = Math.min(r, g, b);
//   let h = 0, s, l = (max + min) / 2;
  
//   if (max === min) {
//     h = s = 0;
//   } else {
//     const d = max - min;
//     s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    
//     switch (max) {
//       case r: h = (g - b) / d + (g < b ? 6 : 0); break;
//       case g: h = (b - r) / d + 2; break;
//       case b: h = (r - g) / d + 4; break;
//     }
    
//     h /= 6;
//   }
  
//   return [h * 360, s * 100, l * 100];
// };

// // HSL to RGB conversion
// const hslToRgb = (h: number, s: number, l: number): [number, number, number] => {
//   h /= 360;
//   s /= 100;
//   l /= 100;
  
//   let r, g, b;
  
//   if (s === 0) {
//     r = g = b = l;
//   } else {
//     const hue2rgb = (p: number, q: number, t: number) => {
//       if (t < 0) t += 1;
//       if (t > 1) t -= 1;
//       if (t < 1/6) return p + (q - p) * 6 * t;
//       if (t < 1/2) return q;
//       if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
//       return p;
//     };
    
//     const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
//     const p = 2 * l - q;
    
//     r = hue2rgb(p, q, h + 1/3);
//     g = hue2rgb(p, q, h);
//     b = hue2rgb(p, q, h - 1/3);
//   }
  
//   return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
// };

// const AddProductColoursForm = () => {
//   const [open, setOpen] = useState(false);
//   const router = useRouter();
  

//   const form = useForm<AddProductColourForm>({
//     resolver: zodResolver(addProductColourFormSchema),
//     defaultValues: {
//       colours: [{ name: "", hexcode: "#000000" }]
//     }
//   });

//   const { fields, append, remove } = useFieldArray({
//     name: "colours",
//     control: form.control
//   });

//   const { loading, executeAsync } = useHttp("/product-colours");

//   const onSubmit = async (data: AddProductColourForm) => {
//     try {
//       const response = await executeAsync(data);
//       form.reset();
//       setOpen(false);
//       toast.success(response.message ?? "Colors added successfully");
//       router.refresh();
//     } catch (error: any) {
//       toast.error(error?.message ?? "Failed to add colors");
//     }
//   };
  

//   return (
//     <Sheet open={open} onOpenChange={setOpen}>
//       <SheetTrigger asChild>
//         <Button>
//           Add New Colours <Plus className="ml-2" />
//         </Button>
//       </SheetTrigger>

//       <SheetContent className="min-w-full md:min-w-[50%] lg:min-w-[35%] overflow-y-auto">
//         <SheetHeader>
//           <SheetTitle>Add New Colours</SheetTitle>
//           <SheetDescription>Choose or search color name</SheetDescription>
//         </SheetHeader>

//         <Form {...form}>
//           <form
//             onSubmit={form.handleSubmit(onSubmit)}
//             className="mt-6 space-y-6"
//           >
//             {fields.map((item, index) => {
//               const colorName = form.watch(`colours.${index}.name`);
//               const filtered = Object.keys(PREDEFINED_COLORS).filter((c) =>
//                 c.toLowerCase().includes(colorName.toLowerCase())
//               );

//               return (
//                 <div key={item.id} className="space-y-3 border-b pb-4">
//                   {/* Color Name with Suggestions */}
//                   <FormField
//                     name={`colours.${index}.name`}
//                     control={form.control}
//                     render={({ field }) => (
//                       <FormItem>
//                         <FormLabel>Colour Name</FormLabel>
//                         <FormControl>
//                           <Input
//                             {...field}
//                             placeholder="Search or type e.g. Red"
//                             autoComplete="off"
//                           />
//                         </FormControl>

//                         {/* Suggestions Dropdown */}
//                         {filtered.length > 0 && colorName.length >= 1 && (
//                           <div className="border rounded-md bg-white shadow-md mt-1 max-h-32 overflow-auto">
//                             {filtered.map((c) => (
//                               <button
//                                 key={c}
//                                 type="button"
//                                 className="flex items-center gap-2 px-3 py-1 w-full text-left hover:bg-gray-100"
//                                 onClick={() => {
//                                   form.setValue(`colours.${index}.name`, c);
//                                   form.setValue(
//                                     `colours.${index}.hexcode`,
//                                     PREDEFINED_COLORS[c]
//                                   );
//                                 }}
//                               >
//                                 <span
//                                   className="w-4 h-4 rounded-full"
//                                   style={{ backgroundColor: PREDEFINED_COLORS[c] }}
//                                 />
//                                 {c}
//                               </button>
//                             ))}
//                           </div>
//                         )}

//                         <FormMessage />
//                       </FormItem>
//                     )}
//                   />

//                   {/* Enhanced Color Picker */}
//                   <FormField
//                     name={`colours.${index}.hexcode`}
//                     control={form.control}
//                     render={({ field }) => {
//                       const [showColorPicker, setShowColorPicker] = useState(false);
//                       const [recentColors, setRecentColors] = useState<string[]>([
//                         '#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#800080', '#FFC0CB'
//                       ]);

//                       // Add color to recent colors
//                       const addToRecentColors = (color: string) => {
//                         if (!recentColors.includes(color)) {
//                           const newRecent = [color, ...recentColors.slice(0, 9)];
//                           setRecentColors(newRecent);
//                         }
//                       };

//                       // Color categories for quick selection
//                       const colorCategories = {
//                         'Primary': ['#FF0000', '#0000FF', '#00FF00', '#FFFF00', '#FFA500', '#800080'],
//                         'Pastels': ['#FFD1DC', '#AEC6CF', '#77DD77', '#FDFD96', '#B39EB5', '#FFB347'],
//                         'Earth Tones': ['#8B4513', '#A0522D', '#C2B280', '#8A9A5B', '#6B8E23', '#D2691E'],
//                         'Cool Tones': ['#87CEEB', '#40E0D0', '#9370DB', '#4169E1', '#1E90FF', '#00CED1'],
//                         'Warm Tones': ['#FF6347', '#FFD700', '#FF69B4', '#CD853F', '#DC143C', '#FF8C00'],
//                       };

//                       // Popular named colors for selection
//                       const popularColors = [
//                         { name: 'Red', value: '#FF0000' },
//                         { name: 'Blue', value: '#0000FF' },
//                         { name: 'Green', value: '#00FF00' },
//                         { name: 'Yellow', value: '#FFFF00' },
//                         { name: 'Purple', value: '#800080' },
//                         { name: 'Orange', value: '#FFA500' },
//                         { name: 'Pink', value: '#FFC0CB' },
//                         { name: 'Teal', value: '#008080' },
//                         { name: 'Coral', value: '#FF7F50' },
//                         { name: 'Lavender', value: '#E6E6FA' },
//                         { name: 'Mint', value: '#98FB98' },
//                         { name: 'Navy', value: '#000080' },
//                       ];

//                       const handleColorSelect = (color: string) => {
//                         field.onChange(color);
//                         addToRecentColors(color);
//                         setShowColorPicker(false);
//                       };

//                       return (
//                         <FormItem>
//                           <FormLabel className="flex items-center gap-2 text-sm font-medium">
//                             <Palette className="w-4 h-4" />
//                             Color Selection
//                           </FormLabel>
                          
//                           <div className="space-y-4">
//                             {/* Color Preview and Input Section */}
//                             <div className="flex items-center gap-4">
//                               <div className="relative group">
//                                 <div 
//                                   className="w-16 h-16 rounded-xl border-2 border-gray-200 shadow-lg cursor-pointer transition-all duration-200 hover:scale-105 hover:shadow-xl"
//                                   style={{ 
//                                     backgroundColor: field.value || '#FFFFFF',
//                                     backgroundImage: !field.value ? 
//                                       'repeating-conic-gradient(#E5E7EB 0% 25%, #FFFFFF 0% 50%) 50% / 20px 20px' : 'none'
//                                   }}
//                                   onClick={() => setShowColorPicker(!showColorPicker)}
//                                 >
//                                   {/* Color code overlay on hover */}
//                                   <div className="absolute inset-0 bg-black/70 opacity-0 group-hover:opacity-100 transition-opacity duration-200 rounded-xl flex items-center justify-center">
//                                     <span className="text-white text-xs font-mono">
//                                       {field.value || 'No color'}
//                                     </span>
//                                   </div>
//                                 </div>
                                
//                                 {/* Current color indicator dot */}
//                                 {field.value && (
//                                   <div className="absolute -top-1 -right-1 w-4 h-4 rounded-full border-2 border-white shadow-sm"
//                                     style={{ backgroundColor: field.value }}
//                                   />
//                                 )}
//                               </div>

//                               {/* Color Input with Copy Functionality */}
//                               <div className="flex-1 space-y-2">
//                                 <div className="relative">
//                                   <Input
//                                     type="text"
//                                     value={field.value || ''}
//                                     onChange={(e) => field.onChange(e.target.value)}
//                                     placeholder="#000000"
//                                     className="font-mono pr-10"
//                                   />
//                                   {field.value && (
//                                     <button
//                                       type="button"
//                                       onClick={() => {
//                                         navigator.clipboard.writeText(field.value);
//                                         toast.success("Color code copied to clipboard");
//                                       }}
//                                       className="absolute right-2 top-1/2 -translate-y-1/2 p-1 hover:bg-gray-100 rounded"
//                                       title="Copy color code"
//                                     >
//                                       <Copy className="w-4 h-4 text-gray-500" />
//                                     </button>
//                                   )}
//                                 </div>
                                
//                                 {/* Color Name Display */}
//                                 {field.value && (
//                                   <div className="text-sm text-gray-600 flex items-center gap-2">
//                                     <span>Selected:</span>
//                                     <span className="font-medium">
//                                       {Object.entries(PREDEFINED_COLORS).find(([_, hex]) => hex.toLowerCase() === field.value.toLowerCase())?.[0] || 'Custom Color'}
//                                     </span>
//                                   </div>
//                                 )}
//                               </div>
//                             </div>

//                             {/* Enhanced Color Picker Modal */}
//                             {showColorPicker && (
//                               <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
//                                 <div className="bg-white rounded-2xl shadow-2xl w-[90vw] max-w-4xl max-h-[90vh] overflow-hidden">
//                                   {/* Header */}
//                                   <div className="p-6 border-b flex justify-between items-center bg-gradient-to-r from-gray-50 to-white">
//                                     <div>
//                                       <h3 className="text-lg font-semibold">Color Picker</h3>
//                                       <p className="text-sm text-gray-500">Select a color or enter custom hex code</p>
//                                     </div>
//                                     <button
//                                       onClick={() => setShowColorPicker(false)}
//                                       className="p-2 hover:bg-gray-100 rounded-full"
//                                     >
//                                       <X className="w-5 h-5" />
//                                     </button>
//                                   </div>

//                                   <div className="grid grid-cols-1 lg:grid-cols-3 h-[60vh]">
//                                     {/* Left: Color Wheel and Input */}
//                                     <div className="p-6 border-r space-y-6">
//                                       <div className="aspect-square">
//                                         <FormControl>
//                                           <Input
//                                             type="color"
//                                             value={field.value || '#FFFFFF'}
//                                             onChange={(e) => handleColorSelect(e.target.value)}
//                                             className="w-full h-full cursor-pointer rounded-lg"
//                                           />
//                                         </FormControl>
//                                       </div>
                                      
//                                       <div className="space-y-4">
//                                         <div>
//                                           <label className="block text-sm font-medium mb-2">Custom Hex</label>
//                                           <div className="flex gap-2">
//                                             <Input
//                                               type="text"
//                                               value={field.value || ''}
//                                               onChange={(e) => field.onChange(e.target.value)}
//                                               placeholder="#000000"
//                                               className="font-mono"
//                                             />
//                                             <button
//                                               onClick={() => {
//                                                 const randomColor = `#${Math.floor(Math.random()*16777215).toString(16).padStart(6, '0')}`;
//                                                 handleColorSelect(randomColor);
//                                               }}
//                                               className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-sm font-medium"
//                                               title="Generate random color"
//                                             >
//                                               🎲 Random
//                                             </button>
//                                           </div>
//                                         </div>

//                                         {/* Color Preview */}
//                                         <div className="p-4 bg-gray-50 rounded-lg">
//                                           <div className="flex items-center justify-between mb-2">
//                                             <span className="text-sm font-medium">Preview</span>
//                                             <div className="flex items-center gap-2">
//                                               <div className="w-8 h-8 rounded border"
//                                                 style={{ backgroundColor: field.value || '#FFFFFF' }}
//                                               />
//                                               <span className="font-mono text-sm">{field.value || '#FFFFFF'}</span>
//                                             </div>
//                                           </div>
//                                           <div className="h-12 rounded-lg border"
//                                             style={{ backgroundColor: field.value || '#FFFFFF' }}
//                                           />
//                                         </div>
//                                       </div>
//                                     </div>

//                                     {/* Middle: Color Categories */}
//                                     <div className="p-6 border-r overflow-y-auto">
//                                       <div className="space-y-6">
//                                         {Object.entries(colorCategories).map(([category, colors]) => (
//                                           <div key={category}>
//                                             <h4 className="text-sm font-semibold mb-3 text-gray-700">{category}</h4>
//                                             <div className="grid grid-cols-6 gap-2">
//                                               {colors.map((color) => (
//                                                 <button
//                                                   key={color}
//                                                   type="button"
//                                                   onClick={() => handleColorSelect(color)}
//                                                   className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 hover:shadow-md transition-all duration-150"
//                                                   style={{ backgroundColor: color }}
//                                                   title={color}
//                                                 />
//                                               ))}
//                                             </div>
//                                           </div>
//                                         ))}
//                                       </div>
//                                     </div>

//                                     {/* Right: Recent & Popular Colors */}
//                                     <div className="p-6 space-y-6 overflow-y-auto">
//                                       {/* Recent Colors */}
//                                       <div>
//                                         <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
//                                           <Clock className="w-4 h-4" />
//                                           Recently Used
//                                         </h4>
//                                         <div className="grid grid-cols-8 gap-2">
//                                           {recentColors.map((color) => (
//                                             <button
//                                               key={color}
//                                               type="button"
//                                               onClick={() => handleColorSelect(color)}
//                                               className="w-8 h-8 rounded-lg border-2 border-white shadow-sm hover:scale-110 transition-transform duration-150 relative group"
//                                               style={{ backgroundColor: color }}
//                                               title={color}
//                                             >
//                                               <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 rounded-lg flex items-center justify-center">
//                                                 <Check className="w-3 h-3 text-white" />
//                                               </div>
//                                             </button>
//                                           ))}
//                                         </div>
//                                       </div>

//                                       {/* Popular Colors */}
//                                       <div>
//                                         <h4 className="text-sm font-semibold mb-3 text-gray-700 flex items-center gap-2">
//                                           <Star className="w-4 h-4" />
//                                           Popular Colors
//                                         </h4>
//                                         <div className="space-y-2">
//                                           {popularColors.map(({ name, value }) => (
//                                             <button
//                                               key={value}
//                                               type="button"
//                                               onClick={() => handleColorSelect(value)}
//                                               className="w-full flex items-center gap-3 p-2 rounded-lg hover:bg-gray-50 transition-colors duration-150 group"
//                                             >
//                                               <div 
//                                                 className="w-8 h-8 rounded-lg border"
//                                                 style={{ backgroundColor: value }}
//                                               />
//                                               <div className="flex-1 text-left">
//                                                 <div className="font-medium text-sm">{name}</div>
//                                                 <div className="text-xs text-gray-500 font-mono">{value}</div>
//                                               </div>
//                                               {field.value === value && (
//                                                 <Check className="w-4 h-4 text-green-500" />
//                                               )}
//                                             </button>
//                                           ))}
//                                         </div>
//                                       </div>

//                                       {/* Quick Action Buttons */}
//                                       {/* <div className="pt-4 border-t">
//                                         <div className="grid grid-cols-2 gap-2">
//                                           <button
//                                             type="button"
//                                             onClick={() => handleColorSelect('#000000')}
//                                             className="px-3 py-2 bg-gray-900 text-white rounded-lg text-sm font-medium hover:bg-gray-800"
//                                           >
//                                             Black
//                                           </button>
//                                           <button
//                                             type="button"
//                                             onClick={() => handleColorSelect('#FFFFFF')}
//                                             className="px-3 py-2 bg-white border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
//                                           >
//                                             White
//                                           </button>
//                                           <button
//                                             type="button"
//                                             onClick={() => handleColorSelect('#000000')}
//                                             className="px-3 py-2 bg-red-50 text-red-600 rounded-lg text-sm font-medium hover:bg-red-100 col-span-2"
//                                           >
//                                             Clear Color
//                                           </button>
//                                         </div>
//                                       </div> */}
//                                     </div>
//                                   </div>

//                                   {/* Footer */}
//                                   <div className="p-4 border-t bg-gray-50 flex justify-between items-center">
//                                     <div className="flex items-center gap-4">
//                                       <div className="flex items-center gap-2">
//                                         <div 
//                                           className="w-8 h-8 rounded border"
//                                           style={{ backgroundColor: field.value || '#FFFFFF' }}
//                                         />
//                                         <div>
//                                           <div className="text-sm font-medium">
//                                             {field.value ? 
//                                               Object.entries(PREDEFINED_COLORS).find(([_, hex]) => hex.toLowerCase() === field.value.toLowerCase())?.[0] || 'Custom Color' :
//                                               'No color selected'
//                                             }
//                                           </div>
//                                           <div className="text-xs text-gray-500 font-mono">{field.value || '#FFFFFF'}</div>
//                                         </div>
//                                       </div>
//                                     </div>
//                                     <div className="flex gap-2">
//                                       <button
//                                         onClick={() => setShowColorPicker(false)}
//                                         className="px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium hover:bg-gray-50"
//                                       >
//                                         Cancel
//                                       </button>
//                                       <button
//                                         onClick={() => setShowColorPicker(false)}
//                                         className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
//                                       >
//                                         Apply Color
//                                       </button>
//                                     </div>
//                                   </div>
//                                 </div>
//                               </div>
//                             )}

//                             {/* Quick Color Palette (Always Visible) */}
//                             {!showColorPicker && (
//                               <div className="space-y-3">
//                                 <div className="flex items-center justify-between">
//                                   <span className="text-sm font-medium text-gray-700">Quick Pick</span>
//                                   <button
//                                     type="button"
//                                     onClick={() => setShowColorPicker(true)}
//                                     className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
//                                   >
//                                     <Palette className="w-4 h-4" />
//                                     Show all colors
//                                   </button>
//                                 </div>
                                
//                                 <div className="grid grid-cols-10 gap-2">
//                                   {recentColors.slice(0, 10).map((color) => (
//                                     <button
//                                       key={color}
//                                       type="button"
//                                       onClick={() => handleColorSelect(color)}
//                                       className="relative aspect-square rounded-lg border-2 hover:scale-105 transition-transform duration-150 group"
//                                       style={{ backgroundColor: color }}
//                                       title={color}
//                                     >
//                                       {field.value === color && (
//                                         <div className="absolute inset-0 bg-black/20 rounded-lg flex items-center justify-center">
//                                           <Check className="w-4 h-4 text-white" />
//                                         </div>
//                                       )}
//                                       <div className="absolute bottom-0 left-0 right-0 bg-black/70 text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity duration-150 p-1 rounded-b-lg truncate">
//                                         {color}
//                                       </div>
//                                     </button>
//                                   ))}
//                                 </div>

//                                 {/* Color Harmony Suggestions */}
//                                 {field.value && (
//                                   <div className="mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl">
//                                     <h5 className="text-sm font-semibold mb-3 flex items-center gap-2">
//                                       <Sparkles className="w-4 h-4" />
//                                       Color Harmony Suggestions
//                                     </h5>
//                                     <div className="grid grid-cols-5 gap-2">
//                                       {generateColorHarmony(field.value).map((color, i) => (
//                                         <button
//                                           key={i}
//                                           type="button"
//                                           onClick={() => handleColorSelect(color)}
//                                           className="h-10 rounded-lg border hover:scale-105 transition-transform duration-150"
//                                           style={{ backgroundColor: color }}
//                                           title={color}
//                                         />
//                                       ))}
//                                     </div>
//                                   </div>
//                                 )}
//                               </div>
//                             )}
//                           </div>
                          
//                           <FormMessage />
//                         </FormItem>
//                       );
//                     }}
//                   />

//                   {index > 0 && (
//                     <Button variant="destructive" type="button" onClick={() => remove(index)}>
//                       Remove Colour
//                     </Button>
//                   )}
//                 </div>
//               );
//             })}

//             <Button
//               type="button"
//               variant="outline"
//               className="w-full"
//               onClick={() => append({ name: "", hexcode: "#000000" })}
//             >
//               Add Another Colour
//             </Button>

//             <Button type="submit" disabled={loading} className="w-full">
//               {loading ? "Saving..." : "Save Colours"}
//             </Button>
//           </form>
//         </Form>
//       </SheetContent>
//     </Sheet>
//   );
// };

// export default AddProductColoursForm;