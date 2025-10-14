#!/usr/bin/env tsx
import { db } from '../db';
import { pizzaFlavors, extras, doughTypes } from '@shared/schema';
import { readFile } from 'fs/promises';
// Schema validation for imported data
const validateFlavor = (data) => {
    const required = ['name', 'description', 'prices', 'category'];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    // Validate prices object
    if (typeof data.prices !== 'object') {
        throw new Error('Prices must be an object');
    }
    return {
        name: data.name,
        description: data.description,
        prices: data.prices,
        category: data.category,
        imageUrl: data.imageUrl || null,
        available: data.available !== false // Default to true
    };
};
const validateExtra = (data) => {
    const required = ['name', 'price', 'category'];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return {
        name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        available: data.available !== false
    };
};
const validateDoughType = (data) => {
    const required = ['name', 'price', 'category'];
    for (const field of required) {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    }
    return {
        name: data.name,
        price: parseFloat(data.price),
        category: data.category,
        available: data.available !== false
    };
};
async function importData(options) {
    console.log(`🔄 Importing ${options.type} from ${options.filePath} (${options.format})`);
    try {
        // Read file
        const fileContent = await readFile(options.filePath, 'utf-8');
        let rawData;
        // Parse based on format
        if (options.format === 'csv') {
            // Simple CSV parsing (basic implementation)
            const lines = fileContent.trim().split('\n');
            const headers = lines[0].split(',').map(h => h.trim().replace(/"/g, ''));
            rawData = lines.slice(1).map(line => {
                const values = line.split(',').map(v => v.trim().replace(/"/g, ''));
                const obj = {};
                headers.forEach((header, index) => {
                    obj[header] = values[index] || '';
                });
                return obj;
            });
        }
        else {
            rawData = JSON.parse(fileContent);
        }
        if (!Array.isArray(rawData)) {
            throw new Error('Data must be an array');
        }
        console.log(`📊 Found ${rawData.length} records to import`);
        // Validate and transform data
        let validatedData;
        let table;
        switch (options.type) {
            case 'flavors':
                validatedData = rawData.map(validateFlavor);
                table = pizzaFlavors;
                break;
            case 'extras':
                validatedData = rawData.map(validateExtra);
                table = extras;
                break;
            case 'dough':
                validatedData = rawData.map(validateDoughType);
                table = doughTypes;
                break;
            default:
                throw new Error(`Unknown type: ${options.type}`);
        }
        // Clear existing data if requested
        if (options.replace) {
            console.log(`🧹 Clearing existing ${options.type} data...`);
            await db.delete(table);
        }
        // Insert data
        console.log(`📥 Inserting ${validatedData.length} ${options.type}...`);
        let successCount = 0;
        let errorCount = 0;
        for (const item of validatedData) {
            try {
                await db.insert(table).values(item);
                successCount++;
            }
            catch (error) {
                console.error(`❌ Error inserting item:`, item, error);
                errorCount++;
            }
        }
        console.log(`✅ Import completed: ${successCount} successful, ${errorCount} errors`);
        // Show summary
        const totalCount = await db.select().from(table);
        console.log(`📊 Total ${options.type} in database: ${totalCount.length}`);
    }
    catch (error) {
        console.error(`❌ Import failed:`, error);
        process.exit(1);
    }
}
// CLI interface
async function main() {
    const args = process.argv.slice(2);
    if (args.length < 2) {
        console.log(`
🔄 Manual Data Import Tool

Usage:
  npm run import:csv flavors data/flavors.csv [--replace]
  npm run import:json extras data/extras.json [--replace]
  npm run import:csv dough data/dough.csv [--replace]

Options:
  --replace    Clear existing data before import

Example CSV format (flavors):
  name,description,prices,category,imageUrl,available
  "Margherita","Molho tomate, mozzarella","{""grande"":""35.00""}","salgadas","https://...",true

Example JSON format (flavors):
  [
    {
      "name": "Margherita",
      "description": "Molho tomate, mozzarella",
      "prices": {"grande": "35.00"},
      "category": "salgadas",
      "imageUrl": "https://...",
      "available": true
    }
  ]
`);
        process.exit(1);
    }
    const [type, filePath, ...flags] = args;
    const format = filePath.endsWith('.csv') ? 'csv' : 'json';
    const replace = flags.includes('--replace');
    if (!['flavors', 'extras', 'dough'].includes(type)) {
        console.error(`❌ Invalid type: ${type}. Must be: flavors, extras, dough`);
        process.exit(1);
    }
    await importData({
        type: type,
        format,
        filePath,
        replace
    });
}
// Run CLI if this script is executed directly
if (import.meta.url === new URL(process.argv[1], 'file://').href) {
    main().catch(console.error);
}
export { importData, validateFlavor, validateExtra, validateDoughType };
