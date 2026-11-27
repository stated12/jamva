# Image prompts (generate these yourself and drop the files in `public/`)

The site works without them: every image has a warm illustrated placeholder. When you have the real image, save it with the exact file name below and it is picked up automatically. Use a consistent look: warm natural light, shallow depth of field, rich Indian home-style food, no text or logos in the picture, no people's faces unless stated.

| File | Size | Prompt |
| --- | --- | --- |
| `public/brand/hero-thali.jpg` | 1600x1200 | Overhead photo of a Gujarati thali on a brass plate: dal, kadhi, shaak, rotli, rice, farsan, sweet, soft morning light, warm wooden table, shallow depth of field, editorial food photography |
| `public/brand/rider.jpg` | 1600x1000 | Delivery rider on a scooter in Ahmedabad street at golden hour, carrying a neat insulated bag, motion blur, friendly confident posture, back view, no logos |
| `public/brand/restaurant-owner.jpg` | 1600x1000 | Smiling small restaurant owner at the counter of a clean Indian eatery, holding a phone showing an order, warm light, candid documentary style |
| `public/brand/kitchen.jpg` | 1600x1000 | Busy clean Indian restaurant kitchen, chef plating curry, steam rising, warm tones, cinematic |
| `public/brand/ahmedabad-skyline.jpg` | 1600x900 | Ahmedabad at dusk, Sabarmati riverfront and old city rooftops, soft orange sky, illustration or photo, calm |
| `public/brand/cuisine-gujarati.jpg` | 800x600 | Close-up Gujarati snacks: khaman, fafda, jalebi on a banana leaf, bright natural light |
| `public/brand/cuisine-northindian.jpg` | 800x600 | Butter paneer curry in a copper bowl with naan, steam, dark wood |
| `public/brand/cuisine-streetfood.jpg` | 800x600 | Pav bhaji with butter and chopped onions on a steel plate, street-food stall bokeh |
| `public/brand/cuisine-southindian.jpg` | 800x600 | Crisp dosa with sambar and chutneys on banana leaf, morning light |
| `public/brand/cuisine-chinese.jpg` | 800x600 | Indo-Chinese hakka noodles in a bowl with chopsticks, steam |
| `public/brand/cuisine-dessert.jpg` | 800x600 | Gulab jamun and kulfi on a marble table, soft pastel background |

Restaurant logos, covers and dish photos are uploaded by restaurants themselves from their dashboard. Until they do, the site shows the illustrated placeholders from `components/Art.tsx`.

## Logo files
The logo is vector (`public/logo.svg`, `public/logo-mark.svg`). If you want your chef-hat version as the logo, export it as a transparent PNG or SVG and replace `components/Logo.tsx` and the files in `public/icons/`.
