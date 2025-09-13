#!/usr/bin/env python3
"""
Convert Markdown Masterclass to PDF
This script converts the Masterclass markdown file to a professional PDF document using ReportLab.
"""

from reportlab.lib.pagesizes import A4, letter
from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
from reportlab.lib.units import inch, cm
from reportlab.lib import colors
from reportlab.platypus import SimpleDocTemplate, Paragraph, Spacer, PageBreak, Table, TableStyle, Image
from reportlab.lib.enums import TA_CENTER, TA_LEFT, TA_JUSTIFY, TA_RIGHT
from pathlib import Path
import re
import os

def convert_markdown_to_pdf(markdown_file_path, output_pdf_path):
    """
    Convert a markdown file to PDF with professional styling.
    
    Args:
        markdown_file_path (str): Path to the markdown file
        output_pdf_path (str): Path for the output PDF file
    """
    
    # Read the markdown file
    try:
        with open(markdown_file_path, 'r', encoding='utf-8') as file:
            markdown_content = file.read()
    except FileNotFoundError:
        print(f"Error: Markdown file not found at {markdown_file_path}")
        return False
    except Exception as e:
        print(f"Error reading markdown file: {e}")
        return False
    
    # Create PDF document
    doc = SimpleDocTemplate(
        output_pdf_path,
        pagesize=A4,
        rightMargin=2*cm,
        leftMargin=2*cm,
        topMargin=2.5*cm,
        bottomMargin=2*cm
    )
    
    # Get styles
    styles = getSampleStyleSheet()
    
    # Create custom styles
    title_style = ParagraphStyle(
        'CustomTitle',
        parent=styles['Title'],
        fontSize=24,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_CENTER,
        spaceAfter=12,
        spaceBefore=12,
        fontName='Helvetica-Bold'
    )
    
    subtitle_style = ParagraphStyle(
        'CustomSubtitle',
        parent=styles['Heading1'],
        fontSize=18,
        textColor=colors.HexColor('#2c3e50'),
        alignment=TA_CENTER,
        spaceAfter=20,
        spaceBefore=10,
        fontName='Helvetica'
    )
    
    heading_style = ParagraphStyle(
        'CustomHeading',
        parent=styles['Heading2'],
        fontSize=16,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=12,
        spaceBefore=20,
        fontName='Helvetica-Bold',
        leftIndent=0
    )
    
    subheading_style = ParagraphStyle(
        'CustomSubHeading',
        parent=styles['Heading3'],
        fontSize=14,
        textColor=colors.HexColor('#34495e'),
        spaceAfter=8,
        spaceBefore=15,
        fontName='Helvetica-Bold'
    )
    
    body_style = ParagraphStyle(
        'CustomBody',
        parent=styles['Normal'],
        fontSize=11,
        textColor=colors.HexColor('#333333'),
        spaceAfter=8,
        spaceBefore=0,
        alignment=TA_JUSTIFY,
        fontName='Helvetica'
    )
    
    bullet_style = ParagraphStyle(
        'CustomBullet',
        parent=body_style,
        leftIndent=20,
        bulletIndent=10,
        spaceAfter=6
    )
    
    # Story to hold all elements
    story = []
    
    # Parse markdown content
    lines = markdown_content.split('\n')
    current_list_items = []
    in_list = False
    
    # Get the directory of the markdown file for relative image paths
    markdown_dir = Path(markdown_file_path).parent
    
    for line in lines:
        line = line.strip()
        
        if not line:  # Empty line
            if in_list and current_list_items:
                # End of list, add all items
                for item in current_list_items:
                    story.append(Paragraph(f"• {item}", bullet_style))
                current_list_items = []
                in_list = False
            story.append(Spacer(1, 6))
            continue
        
        # Handle headers
        if line.startswith('# '):
            title_text = line[2:].strip()
            story.append(Paragraph(title_text, title_style))
        elif line.startswith('## '):
            subtitle_text = line[3:].strip()
            story.append(Paragraph(subtitle_text, subtitle_style))
        elif line.startswith('### '):
            heading_text = line[4:].strip()
            story.append(Paragraph(heading_text, heading_style))
        elif line.startswith('#### '):
            subheading_text = line[5:].strip()
            story.append(Paragraph(subheading_text, subheading_style))
        
        # Handle images
        elif line.startswith('![') and '](' in line and line.endswith(')'):
            # Extract image path using regex
            img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
            if img_match:
                alt_text = img_match.group(1)
                img_path = img_match.group(2)
                
                # Handle relative paths
                if not os.path.isabs(img_path):
                    full_img_path = markdown_dir / img_path
                else:
                    full_img_path = Path(img_path)
                
                # Check if image exists
                if full_img_path.exists():
                    try:
                        # Add some space before image
                        story.append(Spacer(1, 12))
                        
                        # Create image with proper sizing
                        img = Image(str(full_img_path))
                        
                        # Scale image to fit page width (max 15cm, maintain aspect ratio)
                        img_width, img_height = img.drawWidth, img.drawHeight
                        max_width = 15*cm
                        max_height = 10*cm
                        
                        # Calculate scaling factor
                        width_scale = max_width / img_width
                        height_scale = max_height / img_height
                        scale = min(width_scale, height_scale, 1.0)  # Don't upscale
                        
                        img.drawWidth = img_width * scale
                        img.drawHeight = img_height * scale
                        
                        story.append(img)
                        
                        # Add caption if alt text exists
                        if alt_text:
                            caption_style = ParagraphStyle(
                                'Caption',
                                parent=body_style,
                                fontSize=10,
                                textColor=colors.HexColor('#666666'),
                                alignment=TA_CENTER,
                                spaceAfter=12,
                                spaceBefore=6,
                                fontName='Helvetica-Oblique'
                            )
                            story.append(Paragraph(f"<i>{alt_text}</i>", caption_style))
                        
                        story.append(Spacer(1, 12))
                        
                    except Exception as e:
                        print(f"Warning: Could not add image {img_path}: {e}")
                        # Add a note about missing image
                        story.append(Paragraph(f"[Image: {alt_text}]", body_style))
                else:
                    print(f"Warning: Image not found: {full_img_path}")
                    # Add a note about missing image
                    story.append(Paragraph(f"[Image not found: {alt_text}]", body_style))
        
        # Handle horizontal rules
        elif line.startswith('---'):
            story.append(Spacer(1, 10))
            # Add a line
            line_table = Table([['']],  colWidths=[15*cm])
            line_table.setStyle(TableStyle([
                ('LINEABOVE', (0,0), (-1,-1), 2, colors.HexColor('#3498db')),
                ('VALIGN', (0,0), (-1,-1), 'MIDDLE'),
            ]))
            story.append(line_table)
            story.append(Spacer(1, 10))
        
        # Handle list items
        elif line.startswith('- ') or line.startswith('* '):
            in_list = True
            item_text = line[2:].strip()
            # Process bold text
            item_text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', item_text)
            current_list_items.append(item_text)
        
        # Handle regular paragraphs
        else:
            if in_list and current_list_items:
                # End of list, add all items
                for item in current_list_items:
                    story.append(Paragraph(f"• {item}", bullet_style))
                current_list_items = []
                in_list = False
            
            # Process bold text and other formatting
            text = re.sub(r'\*\*(.*?)\*\*', r'<b>\1</b>', line)
            text = re.sub(r'\*(.*?)\*', r'<i>\1</i>', text)
            
            # Skip certain markdown syntax lines
            if not text.startswith('**Date:**') and text:
                story.append(Paragraph(text, body_style))
    
    # Handle any remaining list items
    if in_list and current_list_items:
        for item in current_list_items:
            story.append(Paragraph(f"• {item}", bullet_style))
    
    # Build PDF
    try:
        print("Converting to PDF...")
        doc.build(story)
        print(f"✅ PDF successfully created: {output_pdf_path}")
        return True
    except Exception as e:
        print(f"Error converting to PDF: {e}")
        return False

def main():
    """Main function to convert the Masterclass markdown to PDF."""
    
    # Define file paths
    current_dir = Path(__file__).parent
    markdown_file = current_dir / "masterclass.md"
    pdf_file = current_dir / "masterclass.pdf"
 
    print("🔄 Starting Masterclass PDF conversion...")
    print(f"📄 Input file: {markdown_file}")
    print(f"📋 Output file: {pdf_file}")
    
    # Check if markdown file exists
    if not markdown_file.exists():
        print(f"❌ Error: Markdown file not found at {markdown_file}")
        return
    
    # Delete existing PDF if it exists
    if pdf_file.exists():
        try:
            pdf_file.unlink()
            print(f"🗑️  Deleted existing PDF: {pdf_file.name}")
        except Exception as e:
            print(f"⚠️  Warning: Could not delete existing PDF: {e}")
    
    # Convert to PDF
    success = convert_markdown_to_pdf(str(markdown_file), str(pdf_file))
    
    if success:
        print("🎉 Conversion completed successfully!")
        print(f"📍 PDF saved at: {pdf_file.absolute()}")
    else:
        print("❌ Conversion failed!")

if __name__ == "__main__":
    main()
