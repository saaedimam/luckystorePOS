import pandas as pd
import os

source_file = 'data/inventory/Lucky_Store_SKU_List.csv'
template_file = 'data/inventory/products_import_template.xlsx'
output_file = 'data/inventory/Lucky_Store_Odoo_Import.xlsx'

def main():
    print(f"Reading source file: {source_file}")
    df_source = pd.read_csv(source_file)
    
    # Reading template to get exact columns
    df_template = pd.read_excel(template_file)
    template_cols = list(df_template.columns)
    
    # Prepare target dataframe
    df_target = pd.DataFrame(columns=template_cols)
    
    # Map fields
    df_target['Name*'] = df_source['Name']
    df_target['Product Type*'] = 'Goods'
    
    # Track inventory mapping: assuming True/False strings or booleans
    def map_track(val):
        if str(val).lower() in ['true', 'yes', 'y', '1']: return 1
        return 0
        
    df_target['Track Inventory'] = df_source['Track stock'].apply(map_track)
    
    # Option fields or category could go to Product Values, but let's keep it clean
    df_target['Product Values'] = '' 
    
    df_target['Quantity on Hand'] = df_source['In stock [Lucky Store]']
    df_target['Sales Price'] = df_source['Price [Lucky Store]']
    df_target['Cost'] = df_source['Cost']
    
    # Prefer Generated SKU, fallback to SKU
    if 'Generated SKU' in df_source.columns:
        df_target['Internal Reference'] = df_source['Generated SKU']
    else:
        df_target['Internal Reference'] = df_source['SKU']
        
    df_target['Description'] = df_source['Description']
    df_target['Image'] = ''
    
    # Save to Excel
    print(f"Writing to: {output_file}")
    df_target.to_excel(output_file, index=False)
    print("Done! Formatted {} items.".format(len(df_target)))

if __name__ == '__main__':
    main()
