#!/bin/bash
# Aggressively remove backgrounds from ALL sprite images
# Uses multiple passes with different fuzz levels and techniques

SPRITE_DIR="client/public/2dassets/sprites"
BACKUP_DIR="client/public/2dassets/sprites_backup_$(date +%Y%m%d_%H%M%S)"

echo "=== GRUDGE Warlords - Aggressive Background Removal ==="
echo "Processing all sprites in: $SPRITE_DIR"

# Create backup
echo "Creating backup at: $BACKUP_DIR"
cp -r "$SPRITE_DIR" "$BACKUP_DIR"

# Counter
total=0
processed=0

# Process each PNG file
for file in $(find "$SPRITE_DIR" -name "*.png" -type f); do
    total=$((total + 1))
    filename=$(basename "$file")
    echo "Processing ($total): $filename"
    
    # Create temp file
    temp_file="${file}.tmp.png"
    
    # Multi-pass background removal:
    # 1. Remove white backgrounds (various shades)
    # 2. Remove cream/beige backgrounds
    # 3. Remove light gray backgrounds
    # 4. Flood fill from corners to catch any remaining background
    
    # Pass 1: Remove white (high fuzz for off-white)
    convert "$file" -fuzz 20% -transparent white "$temp_file"
    mv "$temp_file" "$file"
    
    # Pass 2: Remove near-white (#F0F0F0 to #FFFFFF range)
    convert "$file" -fuzz 15% -transparent "#FAFAFA" "$temp_file"
    mv "$temp_file" "$file"
    
    # Pass 3: Remove cream/beige (#F5F5DC, #FFFDD0, etc)
    convert "$file" -fuzz 15% -transparent "#F5F5DC" "$temp_file"
    mv "$temp_file" "$file"
    convert "$file" -fuzz 15% -transparent "#FFFDD0" "$temp_file"
    mv "$temp_file" "$file"
    
    # Pass 4: Remove light grays
    convert "$file" -fuzz 12% -transparent "#E0E0E0" "$temp_file"
    mv "$temp_file" "$file"
    convert "$file" -fuzz 12% -transparent "#D0D0D0" "$temp_file"
    mv "$temp_file" "$file"
    
    # Pass 5: Flood fill from all corners to remove connected background
    # This catches any remaining background color connected to edges
    convert "$file" \
        -fuzz 25% \
        -fill none \
        -draw "matte 0,0 floodfill" \
        -draw "matte 0,%[fx:h-1] floodfill" \
        -draw "matte %[fx:w-1],0 floodfill" \
        -draw "matte %[fx:w-1],%[fx:h-1] floodfill" \
        "$temp_file" 2>/dev/null
    
    if [ -f "$temp_file" ]; then
        mv "$temp_file" "$file"
    fi
    
    # Pass 6: Remove any remaining light colors at edges
    convert "$file" -fuzz 18% -transparent "#F0F0F0" "$temp_file"
    mv "$temp_file" "$file"
    
    processed=$((processed + 1))
    echo "  ✓ Cleaned: $filename"
done

echo ""
echo "=== Background Removal Complete ==="
echo "Processed $processed of $total sprites"
echo "Backup saved at: $BACKUP_DIR"
