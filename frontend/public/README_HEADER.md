# How to Add Custom Header Image for PDF

## Instructions:

1. **Save your header image** (the one with SCET logo, college name, and accreditation badges) as one of these files in the `public` folder:
   - `header.svg` (recommended - best quality)
   - `header.png` (alternative)
   - Or replace the existing `logo.png` or `logo2.png`

2. **Image Specifications:**
   - Recommended width: 1000-1200 pixels
   - Recommended height: 150-200 pixels
   - Format: PNG or SVG
   - Background: White or transparent

3. **What the code does:**
   - First tries to load `/header.svg`
   - If that fails, tries `/logo.png`
   - If that fails, tries `/logo2.png`
   - If all fail, uses text-based fallback header

4. **Testing:**
   - After adding the image, reload the page
   - Try generating a PDF report
   - The image should appear at the top of the PDF

## Current Header Layout:

The image should contain:
- **Left**: SCET logo/text
- **Center**: 
  - "srivenkateshwaraa" (sri in green, venkateshwaraa in blue)
  - "College of Engineering & Technology"
  - Blue banner: "ASPIRE TO EXCEL"
  - "Ariyur, Puducherry - 605102."
- **Right**: 
  - NAAC GRADE A (red)
  - NBA (cyan)
  - ISO 21001 (blue)
