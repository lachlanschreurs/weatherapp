/*
  # Add Image Support to Chat Messages

  ## Changes
  
  1. Add image_url column to chat_messages table
    - Stores base64 image data or reference to uploaded images
    - Allows users to send photos of pests, diseases, etc. to Farmer Joe
    - Optional field (nullable)
  
  2. Security
    - No RLS changes needed - existing policies cover the new column
    - Users can only access their own chat messages with images
*/

-- Add image_url column to chat_messages table if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'chat_messages' AND column_name = 'image_url'
  ) THEN
    ALTER TABLE chat_messages ADD COLUMN image_url text;
  END IF;
END $$;
