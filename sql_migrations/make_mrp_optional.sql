-- Migration to make MRP column optional in products table
-- This allows products to be created without an MRP value

-- Remove the NOT NULL constraint from the mrp column
ALTER TABLE products
ALTER COLUMN mrp DROP NOT NULL;

-- Optional: Set a default value of NULL for the mrp column
ALTER TABLE products
ALTER COLUMN mrp SET DEFAULT NULL;

-- Verify the change
-- You can uncomment the line below to check the column definition
-- \d products;