"""
Generate two mockup images for the wisdom share card:
- Option A: Keep original font size, shorter/condensed content
- Option B: Smaller font, full content displayed
"""
from PIL import Image, ImageDraw, ImageFont
import textwrap

# Original full wisdom text (from user's screenshot)
FULL_TEXT = (
    '"You observe the \'cool weather\' and the simple act of \'wearing different layers,\' '
    'finding contentment in this present moment. This is a clear demonstration of being fully present, '
    'embracing the conditions as they are, without resistance. To appreciate the cool air and the comfort '
    'of clothing is to acknowledge the direct experience of life, finding peace in its ordinary unfolding. '
    'There is no need for grand events; true joy often resides in the quiet acceptance of what is here now. '
    'This gentle observation of your surroundings and your response to them reveals a calm and accepting mind."'
)

# Condensed version for Option A
CONDENSED_TEXT = (
    '"You find contentment in the present moment — '
    'the cool weather, the comfort of clothing. '
    'This is being fully present, embracing life as it is. '
    'True joy resides in the quiet acceptance of what is here now. '
    'Your gentle observation reveals a calm and accepting mind."'
)

SIGNATURE = "- Insight Entries"

# Card dimensions (3:4 ratio, same as original)
WIDTH = 1080
HEIGHT = 1440
PADDING = 80
CONTENT_PADDING_H = 40

def create_card(text, font_size, line_spacing_factor, output_path, label):
    """Create a wisdom share card image."""
    img = Image.new('RGB', (WIDTH, HEIGHT), '#000000')
    draw = ImageDraw.Draw(img)
    
    # Use a serif font
    try:
        font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSerif.ttf", font_size)
    except:
        font = ImageFont.load_default()
    
    try:
        sig_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans.ttf", 32)
    except:
        sig_font = ImageFont.load_default()
    
    try:
        label_font = ImageFont.truetype("/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf", 28)
    except:
        label_font = ImageFont.load_default()
    
    # Calculate available width for text
    available_width = WIDTH - 2 * PADDING - 2 * CONTENT_PADDING_H
    
    # Wrap text
    chars_per_line = int(available_width / (font_size * 0.55))
    wrapped = textwrap.fill(text, width=chars_per_line)
    lines = wrapped.split('\n')
    
    line_height = int(font_size * line_spacing_factor)
    total_text_height = len(lines) * line_height
    
    # Calculate vertical position (center the text)
    sig_area_height = 80
    content_area_height = HEIGHT - 2 * PADDING - sig_area_height
    start_y = PADDING + (content_area_height - total_text_height) // 2
    start_y = max(PADDING + 20, start_y)
    
    # Draw each line centered
    for i, line in enumerate(lines):
        bbox = draw.textbbox((0, 0), line, font=font)
        text_width = bbox[2] - bbox[0]
        x = (WIDTH - text_width) // 2
        y = start_y + i * line_height
        draw.text((x, y), line, fill='#FFFFFF', font=font)
    
    # Draw signature
    sig_bbox = draw.textbbox((0, 0), SIGNATURE, font=sig_font)
    sig_width = sig_bbox[2] - sig_bbox[0]
    sig_x = WIDTH - PADDING - CONTENT_PADDING_H - sig_width
    sig_y = HEIGHT - PADDING - 40
    draw.text((sig_x, sig_y), SIGNATURE, fill='#E8A838', font=sig_font)
    
    # Draw label at top-left corner
    draw.rounded_rectangle(
        [20, 20, 420, 70],
        radius=10,
        fill='#FF8C42'
    )
    draw.text((30, 28), label, fill='#FFFFFF', font=label_font)
    
    # Check if text overflows
    last_line_y = start_y + (len(lines) - 1) * line_height + font_size
    overflow = last_line_y > (HEIGHT - PADDING - sig_area_height)
    
    if overflow:
        # Draw overflow warning
        draw.rounded_rectangle(
            [20, HEIGHT - 90, 350, HEIGHT - 50],
            radius=10,
            fill='#EF4444'
        )
        draw.text((30, HEIGHT - 85), "⚠ TEXT OVERFLOW", fill='#FFFFFF', font=label_font)
    
    img.save(output_path, 'PNG')
    print(f"Saved: {output_path} | Lines: {len(lines)} | Font: {font_size}px | Overflow: {overflow}")
    return overflow


# === Option A: Original font size (48px), condensed content ===
print("=== Option A: Original font, condensed content ===")
create_card(
    text=CONDENSED_TEXT,
    font_size=48,
    line_spacing_factor=1.5,
    output_path="/home/ubuntu/gratitude_journal_app/mockup_option_a.png",
    label="方案A: 原字体 + 精简内容"
)

# === Option B: Smaller font (36px), full content ===
print("\n=== Option B: Smaller font, full content ===")
overflow = create_card(
    text=FULL_TEXT,
    font_size=36,
    line_spacing_factor=1.5,
    output_path="/home/ubuntu/gratitude_journal_app/mockup_option_b.png",
    label="方案B: 小字体 + 完整内容"
)

# If Option B still overflows, try even smaller
if overflow:
    print("\n=== Option B (adjusted): Even smaller font ===")
    create_card(
        text=FULL_TEXT,
        font_size=32,
        line_spacing_factor=1.45,
        output_path="/home/ubuntu/gratitude_journal_app/mockup_option_b.png",
        label="方案B: 小字体 + 完整内容"
    )

print("\nDone! Mockups generated.")
