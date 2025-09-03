-- Migration to increase amount field precision from decimal(20,18) to decimal(30,18)
-- This allows storing larger token amounts like 1000+ tokens

ALTER TABLE claims ALTER COLUMN amount TYPE decimal(30, 18);