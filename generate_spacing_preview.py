"""
Generate before/after preview images for share card spacing adjustment.
Accurate simulation of the actual React Native layout.
"""
from PIL import Image, ImageDraw, ImageFont
import textwrap

CARD_W, CARD_H = 1080, 1440

WISDOM_TEXT = (
    '"You observe the \'cool weather\' and the simple act of \'wearing '
    'different layers,\' finding contentment in this present moment. '
    'This is a clear demonstration of being fully present, embracing '
    'the conditions as they are, without resistance. To appreciate the '
    'cool air and the comfort of clothing is to acknowledge the direct '
    'experience of life, finding peace in its ordinary unfolding. There '
    'is no need for grand events; true joy often resides in the quiet '
    'acceptance of what is here now. This gentle observation of your '
    'surroundings and your response to them reveals a calm and '
    'accepting mind. May your awareness continue to bring you '
    'peace, finding beauty in each breath and every moment."'
)

MASTER_NAME = "Buddha"
MASTER_ICON = "\U0001f9d8"  # lotus/meditation emoji placeholder
SIGNATURE = "- Insight Entries"

def try_load_font(size, serif=False):
    paths = [
        "/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf" if serif else "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
        "/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf",
    ]
    for p in paths:
        try:
            return ImageFont.truetype(p, size)
        except:
            continue
    return ImageFont.load_default()

def draw_card(pad_top, pad_bottom, pad_h, label):
    img = Image.new('RGB', (CARD_W, CARD_H), '#000000')
    draw = ImageDraw.Draw(img)

    font_master = try_load_font(36)
    font_wisdom = try_load_font(34, serif=True)
    font_sig = try_load_font(32)
    font_label = try_load_font(28)

    gold = '#E8A838'
    white = '#FFFFFF'

    # --- Master name ---
    master_text = f"{MASTER_NAME}"
    master_bbox = draw.textbbox((0, 0), master_text, font=font_master)
    master_h = master_bbox[3] - master_bbox[1]
    master_w = master_bbox[2] - master_bbox[0]
    master_y = pad_top + 8
    draw.text(((CARD_W - master_w) // 2, master_y), master_text, fill=gold, font=font_master)

    # --- Signature ---
    sig_bbox = draw.textbbox((0, 0), SIGNATURE, font=font_sig)
    sig_h = sig_bbox[3] - sig_bbox[1]
    sig_w = sig_bbox[2] - sig_bbox[0]
    sig_y = CARD_H - pad_bottom - 8 - sig_h
    draw.text((CARD_W - pad_h - sig_w, sig_y), SIGNATURE, fill=gold, font=font_sig)

    # --- Wisdom text (centered in remaining space) ---
    content_top = master_y + master_h + 12
    content_bottom = sig_y - 12
    available_h = content_bottom - content_top

    max_chars = 46
    lines = textwrap.wrap(WISDOM_TEXT, width=max_chars)
    line_height = 52
    text_block_h = len(lines) * line_height

    text_start_y = content_top + (available_h - text_block_h) // 2

    for line in lines:
        lb = draw.textbbox((0, 0), line, font=font_wisdom)
        lw = lb[2] - lb[0]
        draw.text(((CARD_W - lw) // 2, text_start_y), line, fill=white, font=font_wisdom)
        text_start_y += line_height

    # Draw padding guides (subtle)
    guide_color = '#333333'
    # Top guide
    draw.line([(0, pad_top), (CARD_W, pad_top)], fill=guide_color, width=1)
    # Bottom guide
    draw.line([(0, CARD_H - pad_bottom), (CARD_W, CARD_H - pad_bottom)], fill=guide_color, width=1)

    # Label
    draw.text((20, CARD_H - 40), label, fill='#555555', font=font_label)

    return img


# BEFORE: padding 80 all sides
before = draw_card(80, 80, 80, "BEFORE: padding 80px")
before.save('/home/ubuntu/gratitude_journal_app/preview_before.png')

# AFTER: padding 40 top/bottom, 60 horizontal
after = draw_card(40, 40, 60, "AFTER: padding 40px top/bottom")
after.save('/home/ubuntu/gratitude_journal_app/preview_after.png')

# Side by side
comp = Image.new('RGB', (CARD_W * 2 + 60, CARD_H + 100), '#1a1a1a')
comp.paste(before, (10, 70))
comp.paste(after, (CARD_W + 50, 70))

draw_c = ImageDraw.Draw(comp)
ft = try_load_font(40)
draw_c.text((CARD_W // 2 - 80, 15), "BEFORE", fill='#FF6666', font=ft)
draw_c.text((CARD_W + 50 + CARD_W // 2 - 60, 15), "AFTER", fill='#66FF66', font=ft)
comp.save('/home/ubuntu/gratitude_journal_app/preview_comparison.png')

print("Done!")
