"""Builds the Bellarej 2 prompt kit page: one complete, self-contained prompt per image."""
import html, json

STYLE = ("STYLE: polished mobile-game art in a classic hand-drawn Arabian-adventure cartoon style: bold clean dark-brown outlines, "
         "warm saturated colors, soft cel shading, expressive faces, playful proportions (big heads, big eyes). Moroccan details: "
         "zellige tiles, fez, djellaba, babouche slippers, brass, Berber carpet patterns. Palette: terracotta, saffron gold, "
         "Majorelle blue, mint green, deep red, cream.")
ASSET = ("GAME-ASSET RULES (most important): one solid, flat, even light-grey background (#D9D9D9) across the whole image. "
         "No scenery, no buildings, no sky, no ground, no floor shadow, no frame, no border, no ornaments, no text, no labels, "
         "no numbers, no watermark. Every view is complete: nothing cropped, wings, tail, feet and hat fully inside the image, "
         "with wide empty grey space around and between views so each one can be cut out cleanly. All views at exactly the same "
         "scale, same soft light from the upper left, same line thickness, each centered in its own cell, views never overlap.")
ORIG = "ORIGINALITY: completely original design; must not resemble any existing film, cartoon or video-game character."
REF = "REFERENCE: if an image is attached, keep its design, colors, outfit and proportions exactly; only the pose and camera angle change."
REF_ART = "REFERENCE: if an image is attached, match its art style, colors and level of detail exactly."
NOFX = "No glow, no motion lines, no sparkles, no effects of any kind: the game adds those itself."

def mount_layout(six):
    return ("LAYOUT: landscape 3:2 image, a grid of 3 columns x 2 rows, the SAME character in every cell, always flying:\n"
            "1. BACK view from behind and slightly above (this is the in-game camera), wings raised high.\n"
            "2. BACK view, same position, wings pushed down (second wing-beat frame).\n"
            "3. TOP view seen straight from above, wings fully spread.\n"
            "4. SIDE view facing RIGHT, wings mid-beat.\n"
            "5. FRONT view, flying toward the viewer, wings spread.\n"
            f"6. {six}")

RIDER_LAYOUT = ("LAYOUT: landscape 3:2 image, a grid of 3 columns x 2 rows. The character is ALONE: NO mount, NO saddle, NO animal under them.\n"
                "1. RIDING pose, BACK view from behind and slightly above: sitting astride an invisible saddle, knees bent outward, hands forward "
                "holding invisible reins, clothes and scarf blowing backward in the wind.\n"
                "2. Same RIDING pose, SIDE view facing RIGHT.\n"
                "3. Same RIDING pose, FRONT view.\n"
                "4. Standing, FRONT view, full body, relaxed confident pose.\n"
                "5. Standing, BACK view, full body.\n"
                "6. Two head close-ups side by side: big happy smile, and surprised (only this cell may be drawn larger).")

def npc_layout(action, frame2, reaction, extra=""):
    return ("LAYOUT: wide landscape 2:1 image, one row of 4 views of the same character, full body, standing on nothing (no ground drawn):\n"
            f"1. {action}, 3/4 front view.\n"
            f"2. {frame2} (next animation frame), 3/4 front view.\n"
            "3. BACK view, standing.\n"
            f"4. Reaction pose: {reaction}." + (("\n" + extra) if extra else ""))

def join(*parts):
    return "\n\n".join(p for p in parts if p)

G = []  # (group id, group title, group note, [items])

# ---------------- Birds ----------------
birds = [
    ("bird-bellarej", "Bellarej, the stork",
     "A friendly white stork with black flight feathers, long orange beak and long orange legs trailing behind in flight, a red fez with a black tassel, a small brown leather satchel on a strap with a Berber-carpet pattern."),
    ("bird-fez", "Fez, the sparrow",
     "A round brown sparrow with a cream belly and big shiny eyes, a red fez with a black tassel, a red scarf with a gold pattern flowing behind, a small satchel with a carpet pattern."),
    ("bird-hudhud", "Hudhud, the hoopoe",
     "A hoopoe with cinnamon-orange feathers, bold black-and-white striped wings and tail, a tall fan-shaped crest with black tips, a long thin curved beak, a small carpet-patterned harness with tiny golden bells."),
    ("bird-saqr", "Saqr, the falcon",
     "A slim falcon with a slate blue-grey back and wings, a speckled cream chest, yellow beak and feet, a small golden ornamental cap on the head, a carpet-patterned harness with golden tassels."),
    ("bird-bouma", "Bouma, the owl",
     "A round owl with a pale heart-shaped face and big dark eyes, brown-and-cream wings, wearing a navy-blue djellaba hood decorated with small golden stars and crescent moons, golden tassels."),
]
PERCH_LAYOUT = ("LAYOUT: wide landscape 2:1 image, one row of 4 views of the same bird, nothing under it (no shoulder, no branch, no ground drawn):\n"
                "1. LANDING, SIDE view facing RIGHT: wings spread wide and tilted back to brake, feet stretched forward to grab.\n"
                "2. PERCHED, SIDE view facing RIGHT: wings neatly folded, feet gripping as if sitting on someone's shoulder, happy.\n"
                "3. PERCHED, FRONT view, wings folded.\n"
                "4. PERCHED, BACK view, wings folded.")
G.append(("birds", "Birds", "The easy stages. Birds fly ALONE, with no rider. Two prompts per bird: flying, then landing and perched (for the scene where the bird lands on Yassine's shoulder). Attach your bird sheet.",
          [item for i, t, d in birds for item in (
              (i, t, "Game picture", join(STYLE, ASSET, f"SUBJECT: {d}", mount_layout("BACK view gliding: wings held straight out and still."), ORIG, REF)),
              (f"{i}-perch", f"{t}: landing and perched", "Game picture", join(STYLE, ASSET, f"SUBJECT: {d}", PERCH_LAYOUT, ORIG, REF)))]))

# ---------------- Dragons ----------------
dragons = [
    ("dragon-atlas", "Atlas, fire dragon",
     "A young red-and-terracotta fire dragon, cute but heroic: cream belly plates, curved cream horns, orange wing membranes, small back spikes, an empty Berber-carpet saddle in deep red and navy with gold tassels and small brass bells, friendly grin.",
     "ABILITY pose, SIDE view facing RIGHT: breathing a stream of orange fire forward, the fire fully inside the image."),
    ("dragon-zarqa", "Zarqa, water dragon",
     "A young Majorelle-blue water dragon: pale-blue belly, fin-like crest and tail fin, translucent light-blue wing membranes, an empty carpet saddle in red and gold with brass bells, cheerful face.",
     "ABILITY pose, SIDE view facing RIGHT: a curling wave of water surging forward, the wave fully inside the image."),
    ("dragon-raml", "Raml, sand dragon",
     "A young sand-gold desert dragon: scales patterned like dune ripples, cream belly, short curled horns, tan wing membranes, an empty carpet saddle in green and red with brass bells, playful face.",
     "ABILITY pose, SIDE view facing RIGHT: curled into a fast spinning dash, eyes squeezed shut, laughing. Draw NO sand and no effect around it: the game adds the sand swirl itself."),
    ("dragon-zellige", "Zellige, crystal dragon",
     "A young mint-green crystal dragon covered in small mosaic-tile scales in green, white and blue, crystal spikes on the back and a crystal tail tip, an empty carpet saddle in red and blue with brass bells, proud smile.",
     "ABILITY pose, SIDE view facing RIGHT: swinging its tail and shattering a burst of green crystals. The crystals are SOLID shapes with dark outlines; NO motion trail, no swoosh, no glow behind them. All fully inside the image."),
    ("dragon-najma", "Najma, star dragon",
     "A young MIDNIGHT-BLUE star dragon (not purple): bright silver-white constellation dots on the scales (flat color, no glow), wings like a starry night sky, pearl-silver CRESCENT-MOON shaped horns, a small crescent at the tail tip, an empty carpet saddle in deep red and gold with brass bells, gentle smile.",
     "ABILITY pose, SIDE view facing RIGHT: roaring, with a ring of small silver-white cartoon stars bursting forward. The stars are SOLID, opaque shapes with dark outlines: no glow, no haze, no see-through light. The ring is fully inside the image."),
]
G.append(("dragons", "Dragons", "The power mounts. Saddles are empty: the riders are separate pictures.",
          [(i, t, "Game picture", join(STYLE, ASSET, f"SUBJECT: {d}", mount_layout(six), ORIG, REF)) for i, t, d, six in dragons]))

G[-1][3].append(("dragon-raml-fix", "Raml: ability pose only (fix)", "Game picture", join(STYLE, ASSET,
    "SUBJECT: " + dragons[2][2],
    "LAYOUT: landscape 3:2 image with ONE view only, centered: ABILITY pose, SIDE view facing RIGHT, at the same scale as the attached sheet: "
    "curled into a fast spinning dash, eyes squeezed shut, laughing, wings tucked half-open. Draw NO sand, no dust and no effect around it: the game adds the sand swirl itself.",
    ORIG, REF)))

def ability_fix(idx, title, pose):
    return (f"{dragons[idx][0]}-fix", f"{title}: ability pose only (fix)", "Game picture", join(STYLE, ASSET,
        "SUBJECT: " + dragons[idx][2],
        "LAYOUT: landscape 3:2 image with ONE view only, centered, at the same scale as the attached sheet: " + pose,
        NOFX, ORIG, REF))
G[-1][3].append(ability_fix(3, "Zellige", "ABILITY pose, SIDE view facing RIGHT: swinging its tail and shattering a burst of green crystals. "
    "The crystals are SOLID shapes with dark outlines, like the crystal on its tail tip. NO motion trail, no swoosh line, no glow, no haze. All fully inside the image."))
G[-1][3].append(ability_fix(4, "Najma", "ABILITY pose, SIDE view facing RIGHT: roaring, mouth open, with a ring of small silver-white cartoon stars bursting forward. "
    "The stars are SOLID five-pointed shapes with dark outlines. NO glow, no sparkle dust, no haze, no see-through light. The ring is fully inside the image."))

# ---------------- Riders ----------------
riders = [
    ("rider-yassine", "Yassine",
     "Yassine, an original 13-year-old Moroccan boy: short curly black hair, freckles on the nose, a red fez with a black tassel, a cream long-sleeved buttoned shirt, a CLOSED embroidered Moroccan gilet in terracotta and mint green with gold trim, olive-green sirwal trousers (clean, no patches), yellow babouche slippers, a small brown leather satchel across the chest with a wooden slingshot tucked in, a red scarf around the neck in EVERY view, warm confident grin. NOT: no purple vest, no bare chest, no patched trousers."),
    ("rider-salma", "Salma",
     "Salma, an original 13-year-old Moroccan girl, adventurous and clever: dark hair in a single thick braid tucked under a teal headscarf, tiny silver stud earrings (no hoops), a cream tunic with Majorelle-blue embroidery, a long saffron-yellow sash, terracotta trousers with a small zellige-pattern border at the ankles, red babouche slippers, a leather satchel full of rolled maps, a small brass compass on a cord, brave determined smile."),
    ("rider-jeddi", "Jeddi Hmad",
     "Jeddi Hmad, a kind old Moroccan storyteller grandfather: white beard, round golden glasses, a red fez with a black tassel, a brown wool djellaba with the hood down, a white embroidered scarf, a small leather bag with a brass bell, a carved wooden walking cane held in one hand, gentle laughing face."),
]
YASSINE_STORY = ("LAYOUT: landscape 3:2 image, a grid of 3 columns x 2 rows, Yassine ALONE (no bird, no dragon, no animal drawn anywhere), standing on nothing (no ground drawn):\n"
                 "1. Standing, 3/4 FRONT view, right arm relaxed, head turned up toward his right shoulder, smiling proudly (a bird will be added there by the game; do NOT draw it).\n"
                 "2. WHISTLING, 3/4 FRONT view: two fingers in his mouth, cheeks puffed, eyes looking up at the sky.\n"
                 "3. WHISTLING, BACK view from behind and slightly above, two fingers at his mouth, looking up.\n"
                 "4. Crouching, ready to jump, SIDE view facing RIGHT, arms swung back.\n"
                 "5. LEAPING up and forward, SIDE view facing RIGHT, legs apart as if about to land on a saddle, scarf flying.\n"
                 "6. LEAPING, BACK view from behind and slightly above, arms forward, legs apart.")
G.append(("riders", "Rider heroes", "Riders ride the DRAGONS only. Drawn without any mount, so the game can put any rider on any dragon.",
          [(i, t, "Game picture", join(STYLE, ASSET, f"SUBJECT: {d}", RIDER_LAYOUT, ORIG, REF)) for i, t, d in riders] + [
           ("rider-yassine-story", "Yassine: whistle and jump", "Game picture", join(STYLE, ASSET, f"SUBJECT: {riders[0][2]}", YASSINE_STORY, ORIG, REF))] + [
           ("rider-mishmish", "Mishmish, the cat", "Game picture", join(STYLE, ASSET,
            "SUBJECT: Mishmish, an original ginger striped street cat with big green eyes, a red scarf with a small brass bell.",
            "LAYOUT: landscape 3:2 image, a grid of 3 columns x 2 rows, the cat ALONE (no mount, no animal under it):\n"
            "1. PERCHED pose (crouched, gripping with its paws as if riding on top of a mount's head), BACK view from behind and slightly above, scarf blowing backward.\n"
            "2. Same perched pose, SIDE view facing RIGHT.\n"
            "3. Same perched pose, FRONT view.\n"
            "4. Sitting, FRONT view.\n"
            "5. Sitting, BACK view, tail curled.\n"
            "6. Two head close-ups side by side: laughing, and scared (only this cell may be drawn larger).", ORIG, REF))]))

# ---------------- Street life ----------------
npcs = [
    ("npc-washerwoman", "Washerwoman",
     "A cheerful young Moroccan woman in a modest long embroidered kaftan and a headscarf, family-friendly.",
     "Hanging a white sheet on a short piece of rope (draw only a short rope, no balcony, no building)", "Pegging the sheet, arms slightly lower",
     "waving happily at the player", "Draw her wooden laundry basket as a separate small object next to view 4."),
    ("npc-kids", "Street kids",
     "Two kids about 8 years old playing together: a boy in a small red fez, cream shirt and a sky-blue gilet, and a girl in a yellow headscarf and green dress; they push a wooden hoop with a stick.",
     "Both running, the boy rolling the hoop with the stick", "Both running, the hoop a little further ahead",
     "both jumping and clapping", "Keep the two kids together in every view."),
    ("npc-tea", "Tea seller",
     "A smiling man with a short beard, red fez, white embroidered djellaba, a silver teapot and a brass tray of small mint-tea glasses.",
     "Pouring tea from high above into a small glass", "Pouring, the stream of tea a little longer",
     "raising a glass of tea toward the player"),
    ("npc-guerrab", "Water seller (guerrab)",
     "A traditional Moroccan water seller in a red embroidered costume, a huge wide-brimmed hat covered in colorful pom-pom tassels, brass cups on a leather bandolier, a goatskin water bag, a small brass bell.",
     "Pouring water from the goatskin into a brass cup", "Pouring, cup held a little higher",
     "ringing his bell and laughing"),
    ("npc-spice", "Spice merchant",
     "A kind elderly spice merchant with a white beard, white turban and Majorelle-blue djellaba, holding a scoop of red paprika.",
     "Scooping spice from one small sack (draw only that one sack)", "Lifting the scoop, a little spice falling",
     "shaking his fist but laughing, friendly cartoon style"),
    ("npc-grandmother", "Grandmother",
     "A sweet grandmother with round glasses, a white headscarf and a purple embroidered kaftan, holding a round Moroccan bread loaf (khobz).",
     "Leaning forward and waving, drawn from the waist up as if at a window (do NOT draw the window)", "Waving, hand on the other side",
     "gently tossing the bread loaf forward", "Views 1, 2 and 4 are waist-up; view 3 is the full body from behind."),
    ("npc-musicians", "Gnawa musicians",
     "Two street musicians together: one in a yellow robe with a big double-headed drum, one in a blue robe with metal qraqeb castanets, both in embroidered caps decorated with cowrie shells.",
     "Both dancing and playing", "Both dancing, other foot forward",
     "both laughing with instruments raised", "Keep the two musicians together in every view."),
]
STYLE_MATCH = ("STYLE MATCH: an image of a DIFFERENT street character is attached as the style reference: match its art style exactly "
               "(same line thickness, same soft painted shading, same realistic body proportions, adults about 6 heads tall). "
               "Do NOT copy that character's face, clothes or props: only the drawing style.")
items = [(i, t, "Game picture", join(STYLE, ASSET, f"SUBJECT: {d}", npc_layout(a, f2, r, x), ORIG, STYLE_MATCH)) for i, t, d, a, f2, r, *xs in [n + ("",) * (7 - len(n)) for n in npcs] for x in [xs[0]]]
items += [
    ("npc-cats", "Rooftop cats", "Game picture", join(STYLE, ASSET,
     "SUBJECT: four different friendly street cats of a Moroccan medina.",
     "LAYOUT: wide landscape 2:1 image, one row of 5 views, each a different cat, all at the same scale, nothing under them:\n"
     "1. A ginger tabby sleeping curled up.\n2. A black-and-white cat stretching.\n3. A calico cat sitting and watching.\n"
     "4. A grey cat jumping, seen from the side facing RIGHT.\n5. The ginger tabby running away, seen from behind.", ORIG, REF)),
    ("npc-pigeons", "Pigeons", "Game picture", join(STYLE, ASSET,
     "SUBJECT: grey city pigeons with a green-and-purple sheen on the neck, cute cartoon style.",
     "LAYOUT: wide landscape 2:1 image, one row of 5 views of the same pigeon:\n"
     "1. Standing, side view facing RIGHT.\n2. Pecking the ground (no ground drawn).\n3. Taking off, wings up.\n"
     "4. Flying, seen from BEHIND, wings up.\n5. Flying, seen from BEHIND, wings down.", ORIG, REF)),
]
G.append(("street", "Street life", "Background people and animals. They are never obstacles.", items))

# ---------------- Obstacles ----------------
def obstacle_prompt(level, objects, rows):
    lines = "\n".join(f"Column {k + 1}: {o}" for k, o in enumerate(objects))
    return join(STYLE, ASSET, f"SUBJECT: {level} obstacles for a runner game set in a Moroccan medina. Each object is drawn alone, with no wall, no street and no people around it.",
                f"LAYOUT: landscape 5:3 image, a grid of 5 columns x 2 rows, one object per column, all at the same scale. {rows}\n{lines}", NOFX, REF_ART)
G.append(("obstacles", "Obstacles", "No glow on these pictures: the game makes breakable objects glow itself.", [
    ("obst-easy", "Easy obstacles", "Game picture", obstacle_prompt("EASY",
        ["a Berber carpet hanging from a wooden pole, with tassels", "a rope with five clothes pegged on it (white sheet, blue shirt, red towel, striped djellaba, small shirt), short rope ends",
         "a stack of terracotta clay pots and jars", "a wooden crate with iron corners", "a low market-stall awning: striped blue-and-white fabric on a wooden frame over a table of brass teapots"],
        "Row 1: each object in FRONT view, straight on, as a player flying toward it sees it. Row 2: the same object in SIDE view.")),
    ("obst-medium", "Medium obstacles", "Game picture", obstacle_prompt("MEDIUM",
        ["a brass lantern on a chain hanging from a short wooden wall bracket", "a grey donkey pulling a wooden cart loaded with carpets and baskets",
         "a pair of teal wooden window shutters with carved lattice", "a pile of jute sacks overflowing with red, yellow and green spices", "a stack of woven baskets and copper pots"],
        "Row 1: each object in FRONT view, straight on, as a player flying toward it sees it. Row 2: SIDE view, except column 3 where row 2 shows the shutters OPEN.")),
    ("obst-hard", "Hard obstacles", "Game picture", obstacle_prompt("HARD",
        ["a stone arch gate with a blue zellige frame (never breakable)", "wooden scaffolding made of poles and planks",
         "a big brass chandelier with five small lanterns on chains", "a rope strung with five colorful paper kites and ribbons", "a narrow wooden market cart on wheels with a red awning"],
        "Row 1: each object in FRONT view, straight on, as a player flying toward it sees it. Row 2: SIDE view, except column 2 where row 2 shows the scaffolding COLLAPSING, planks falling.")),
]))

# ---------------- Places ----------------
def kit_prompt(place, materials, night=False):
    light = ("Night lighting: deep moonlit blue shading, every window glowing warm yellow, lanterns lit." if night else "Daylight, soft light from the upper left.")
    return join(STYLE, ASSET.replace("Every view is complete: nothing cropped, wings, tail, feet and hat fully inside the image", "Every piece is complete and nothing is cropped"),
                f"SUBJECT: modular building pieces for the {place} district of a Moroccan medina, used to build a 3D street. Materials and colors: {materials}. {light}",
                "LAYOUT: landscape 2:1 image, a grid of 4 columns x 2 rows. Every piece is drawn ORTHOGRAPHIC: perfectly straight-on front elevation, no perspective, no vanishing points. "
                "All pieces exactly the same height and scale, sitting on one invisible baseline, with straight vertical left and right edges so they can be placed side by side:\n"
                "1. A plain wall section that repeats seamlessly left to right.\n2. A wall with an arched front door.\n3. A wall with two shuttered windows.\n"
                "4. A wall with a wooden balcony and carved lattice railing.\n5. A taller corner tower piece.\n6. A rooftop edge strip that repeats seamlessly left to right.\n"
                "7. A shop front with an awning.\n8. A set of small separate details: a lantern on a wall bracket, two potted plants, a small hanging carpet.",
                "No people, no animals, no text.", REF_ART)

def pano_prompt(place, scene, band):
    return join(STYLE,
                "BACKGROUND RULES: a very wide panorama, landscape 3:1. Far background only: sky and distant scenery. No characters, no animals in front, no text, no frame, "
                "no buildings cut at the left or right edge. The left and right edges must match perfectly so the image repeats seamlessly side by side. "
                f"The bottom 15% fades into one flat, even band of {band} so the game's street can sit in front of it.",
                f"SUBJECT: the far background of the {place} district: {scene}.", REF_ART)

places = [
    ("marrakech", "Marrakech", "terracotta and salmon-pink plastered walls, green glazed-tile roof edges, carved cedar doors and one Majorelle-blue door, brass lanterns, pink bougainvillea in pots",
     "a tall square stone minaret in Marrakech style with a small lantern top and three golden balls, the snowy High Atlas mountains, palm groves, a flat-roofed terracotta medina far away, a soft blue morning sky with puffy clouds", "warm terracotta"),
    ("fes", "Fès", "sand-ochre walls, many small green-tiled roofs, carved cedar-wood balconies, a doorway framed in blue-and-white zellige, brass door knockers",
     "a dense medina climbing a hillside with many green-tiled roofs and minarets, olive-green hills, a monumental gate with blue tiles in the distance, golden afternoon light", "sand ochre"),
    ("chefchaouen", "Chefchaouen", "walls painted in shades of blue and white, blue steps, terracotta flower pots hanging on the walls, small red-tiled roofs, small arched blue doors",
     "a blue-and-white town stacked up a green mountainside, the Rif mountains behind, a small white minaret, a bright blue sky", "soft sky blue"),
    ("desert", "Desert", "mud-brick kasbah walls of rough hand-smoothed earth, tapered towers with carved triangle patterns, palm-wood beams sticking out of the walls, small dark square windows with no shutters, crenellated tops, a simple wooden palm-trunk door, woven palm-leaf mats, a clay water jar. This is a DESERT village, NOT a city street: NO zellige tiles, NO green roof tiles, NO carved stucco arches, NO flowers or bougainvillea, NO striped awnings, NO wrought-iron lanterns. Do not copy the layout of any other kit",
     "golden sand dunes at sunset, a ksar of tapered mud-brick towers, an oasis of palm trees, a big low sun in a purple-orange sky", "golden sand"),
    ("coast", "Coast", "white-washed walls with Majorelle-blue shutters and doors, thick stone ramparts with crenellations, fishing nets, small blue wooden boats leaning on the walls",
     "the Atlantic ocean, a white coastal town behind stone ramparts, a white-and-red lighthouse, seagulls, a bright clear sky", "pale sandy stone"),
    ("night", "Night (Marrakech)", "the same terracotta Marrakech walls, green-tiled roof edges, carved doors and brass lanterns",
     "Marrakech at night: a big bright moon, many stars, the tall minaret lit in warm gold, glowing windows across the medina, a deep navy sky", "deep navy blue"),
]
G.append(("places", "Places", "For each place: one kit of building pieces (game picture) and one far background.", [
    item for pid, name, mat, scene, band in places for item in (
        (f"kit-{pid}", f"{name}: building kit", "Game picture", kit_prompt(name, mat, night=(pid == "night"))),
        (f"bg-{pid}", f"{name}: far background", "Background", pano_prompt(name, scene, band)),
    )]))

# ---------------- Pickups & icons ----------------
G.append(("icons", "Pickups and icons", "Coins, power-ups and the round icons for the screen.", [
    ("icons-all", "Pickups and icons", "Game picture", join(STYLE, ASSET.replace("wings, tail, feet and hat fully inside the image", "every icon fully inside the image"),
     "SUBJECT: collectible items and round interface icons for a Moroccan runner game.",
     "LAYOUT: square 1:1 image, a grid of 4 columns x 4 rows, one item per cell, all at the same size:\n"
     "Row 1: a gold coin with an eight-pointed Moroccan star seen from the front; the same coin turned 45 degrees; the same coin seen edge-on; a pile of three gold coins.\n"
     "Row 2: a blue shield inside a soap-bubble (power-up); a glass of mint tea with fresh mint leaves inside a soap-bubble (power-up); a golden crown; a pause button made of carved wood.\n"
     "Row 3: four round brass medallion icons: a flame (fire), a water drop (wave), a sand swirl (dash), a green crystal (smash).\n"
     "Row 4: a fifth round brass medallion with a crescent moon and a star (starlight); an empty round brass power-meter ring; the same ring half filled with glowing orange; the same ring completely full and glowing.", "No text, no numbers.", REF_ART)),
]))

G[-1][3].append(("icons-powerups-fix", "Power-ups without bubbles (fix)", "Game picture", join(STYLE, ASSET.replace("wings, tail, feet and hat fully inside the image", "every item fully inside the image"),
    "SUBJECT: two power-up items for a Moroccan runner game, matching the attached icon sheet exactly in style, colours and size.",
    "LAYOUT: landscape 2:1 image, two items side by side, same size: 1. the blue shield with a gold rim and a gold eight-pointed star; "
    "2. the glass of mint tea with fresh mint leaves. NO soap bubble, NO glow, NO sparkles around them: the game draws the bubble itself.",
    "No text, no numbers.", REF_ART)))

# ---------------- page ----------------
total = sum(len(items) for _, _, _, items in G)
cards = []
for gid, gtitle, gnote, its in G:
    cards.append(f'<section class="group" id="{gid}"><header class="ghead"><h2>{html.escape(gtitle)}</h2><p>{html.escape(gnote)}</p></header>')
    for pid, title, role, text in its:
        cards.append(
            f'<article class="card" data-id="{pid}"><div class="top">'
            f'<label class="done"><input type="checkbox" id="done-{pid}" data-id="{pid}"><span>{html.escape(title)}</span></label>'
            f'<span class="role {"bg" if role == "Background" else ""}">{role}</span>'
            f'<button type="button" class="copy" data-target="p-{pid}">Copy prompt</button></div>'
            f'<pre id="p-{pid}" class="prompt" tabindex="0">{html.escape(text)}</pre></article>')
    cards.append('</section>')
nav = "".join(f'<a href="#{gid}">{html.escape(gt)} <b>{len(its)}</b></a>' for gid, gt, _, its in G)

page = f"""<title>Bellarej 2 Prompt Kit</title>
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Baloo+Bhaijaan+2:wght@700;800&family=Atkinson+Hyperlegible:wght@400;700&family=IBM+Plex+Mono:wght@400&display=swap" rel="stylesheet">
<style>
/* Layout: a production checklist. Sticky header with progress and group links; one card per image to generate. */
:root {{
  --bg: #eef1f7; --panel: #ffffff; --ink: #1d2236; --muted: #5a6077; --line: #d3d8e6;
  --majorelle: #2741c4; --saffron: #e39a12; --ok: #1f8a5a; --code: #f6f7fb;
  --display: "Baloo Bhaijaan 2", "Trebuchet MS", sans-serif; --body: "Atkinson Hyperlegible", system-ui, sans-serif; --mono: "IBM Plex Mono", ui-monospace, monospace;
}}
@media (prefers-color-scheme: dark) {{ :root:not([data-theme="light"]) {{ --bg: #10142a; --panel: #181d38; --ink: #e9ecf8; --muted: #a3a9c4; --line: #2c3358; --majorelle: #8fa2ff; --saffron: #f0b440; --ok: #4cc28b; --code: #121630; color-scheme: dark; }} }}
:root[data-theme="dark"] {{ --bg: #10142a; --panel: #181d38; --ink: #e9ecf8; --muted: #a3a9c4; --line: #2c3358; --majorelle: #8fa2ff; --saffron: #f0b440; --ok: #4cc28b; --code: #121630; color-scheme: dark; }}
body {{ background: var(--bg); color: var(--ink); font-family: var(--body); font-size: 15px; line-height: 1.5; }}
.wrap {{ max-width: 920px; margin: 0 auto; padding-inline: 16px; padding-block: 0 48px; }}
.bar {{ position: sticky; top: env(safe-area-inset-top, 0px); z-index: 5; background: var(--bg); border-bottom: 1px solid var(--line); padding-block: 10px; }}
.bar .row {{ display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }}
h1 {{ font-family: var(--display); font-size: 28px; line-height: 1.1; margin: 0; letter-spacing: 0.01em; }}
.progress {{ margin-inline-start: auto; font-weight: 700; font-variant-numeric: tabular-nums; color: var(--muted); }}
.progress b {{ color: var(--ok); }}
.meter {{ height: 6px; border-radius: 99px; background: var(--line); overflow: hidden; margin-top: 8px; }}
.meter i {{ display: block; height: 100%; width: 0; background: var(--ok); transition: width .3s; }}
nav {{ display: flex; gap: 6px; flex-wrap: wrap; margin-top: 8px; }}
nav a {{ text-decoration: none; color: var(--ink); background: var(--panel); border: 1px solid var(--line); border-radius: 99px; padding: 3px 10px; font-size: 13px; font-weight: 700; }}
nav a b {{ color: var(--muted); font-weight: 400; }}
.intro {{ display: grid; grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; margin-block: 18px; }}
.box {{ background: var(--panel); border: 1px solid var(--line); border-radius: 12px; padding: 14px 16px; min-width: 0; }}
.box h3 {{ margin: 0 0 6px; font-family: var(--display); font-size: 18px; color: var(--majorelle); }}
.box ol, .box ul {{ margin: 0; padding-inline-start: 20px; }}
.box li {{ margin-bottom: 4px; }}
.group {{ margin-top: 28px; scroll-margin-top: 130px; }}
.ghead h2 {{ font-family: var(--display); font-size: 24px; margin: 0; text-wrap: balance; }}
.ghead p {{ margin: 2px 0 10px; color: var(--muted); }}
.card {{ background: var(--panel); border: 1px solid var(--line); border-radius: 12px; margin-bottom: 12px; overflow: hidden; }}
.card.is-done {{ border-color: var(--ok); }}
.card.is-done .prompt {{ opacity: .55; }}
.top {{ display: flex; align-items: center; gap: 10px; padding: 10px 12px; flex-wrap: wrap; }}
.done {{ display: flex; align-items: center; gap: 8px; font-weight: 700; font-size: 16px; cursor: pointer; min-width: 0; }}
.done input {{ width: 20px; height: 20px; accent-color: var(--ok); }}
.role {{ font-size: 12px; font-weight: 700; letter-spacing: .04em; text-transform: uppercase; color: var(--majorelle); border: 1px solid currentColor; border-radius: 99px; padding: 1px 8px; }}
.role.bg {{ color: var(--saffron); }}
.copy {{ margin-inline-start: auto; font: 700 14px var(--body); color: #fff; background: var(--majorelle); border: 0; border-radius: 8px; padding: 8px 14px; cursor: pointer; }}
.copy.ok {{ background: var(--ok); }}
.copy:focus-visible, nav a:focus-visible, .done input:focus-visible {{ outline: 3px solid var(--saffron); outline-offset: 2px; }}
.prompt {{ margin: 0; padding: 12px 14px; background: var(--code); border-top: 1px solid var(--line); font: 12.5px/1.55 var(--mono); white-space: pre-wrap; word-break: break-word; max-height: 220px; overflow: auto; }}
@media (prefers-reduced-motion: reduce) {{ .meter i {{ transition: none; }} }}
</style>
<div class="bar"><div class="wrap" style="padding-block:0">
  <div class="row"><h1>Bellarej 2 Prompt Kit</h1><span class="progress"><b id="n-done">0</b> / {total} generated</span></div>
  <div class="meter"><i id="meter"></i></div>
  <nav>{nav}</nav>
</div></div>
<main class="wrap">
  <div class="intro">
    <div class="box"><h3>How to use it</h3><ol>
      <li>One prompt = one image. Copy, paste, generate.</li>
      <li>For a character, also attach its reference sheet you already made.</li>
      <li>Tick the box when you keep the result. Ticks are saved in this browser.</li>
    </ol></div>
    <div class="box"><h3>Keep the image only if</h3><ul>
      <li>The background is plain grey, with nothing behind.</li>
      <li>No text, labels or frame anywhere.</li>
      <li>Nothing is cut off: wings, tail, hat, feet.</li>
      <li>All views are the same size. If not, generate again.</li>
    </ul></div>
    <div class="box"><h3>What each picture is for</h3><ul>
      <li><b>Game picture:</b> cut out and used in the game.</li>
      <li><b>Background:</b> the far scenery behind the street.</li>
      <li>Your earlier sheets stay the style reference.</li>
    </ul></div>
  </div>
  {''.join(cards)}
</main>
<script>
(function () {{
  var KEY = 'bellarej2-prompt-kit';
  var state = {{}};
  try {{ state = JSON.parse(localStorage.getItem(KEY) || '{{}}') || {{}}; }} catch (e) {{ state = {{}}; }}
  var boxes = Array.prototype.slice.call(document.querySelectorAll('.done input'));
  function render() {{
    var n = 0;
    boxes.forEach(function (b) {{ var on = !!state[b.dataset.id]; b.checked = on; b.closest('.card').classList.toggle('is-done', on); if (on) n++; }});
    document.getElementById('n-done').textContent = n;
    document.getElementById('meter').style.width = (100 * n / boxes.length) + '%';
  }}
  boxes.forEach(function (b) {{ b.addEventListener('change', function () {{ state[b.dataset.id] = b.checked; try {{ localStorage.setItem(KEY, JSON.stringify(state)); }} catch (e) {{}} render(); }}); }});
  document.querySelectorAll('.copy').forEach(function (btn) {{
    btn.addEventListener('click', function () {{
      var pre = document.getElementById(btn.dataset.target), text = pre.textContent;
      function done() {{ btn.textContent = 'Copied'; btn.classList.add('ok'); setTimeout(function () {{ btn.textContent = 'Copy prompt'; btn.classList.remove('ok'); }}, 1600); }}
      function fallback() {{ var r = document.createRange(); r.selectNodeContents(pre); var s = window.getSelection(); s.removeAllRanges(); s.addRange(r); btn.textContent = 'Selected: copy it'; }}
      try {{ navigator.clipboard.writeText(text).then(done, fallback); }} catch (e) {{ fallback(); }}
    }});
  }});
  render();
}})();
</script>
"""
open('/home/claude/bellarej2-doc/prompts.html', 'w').write(page)
print('prompts', total, 'groups', [(g[0], len(g[3])) for g in G])
