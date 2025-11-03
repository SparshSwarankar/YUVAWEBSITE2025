# migrate_colleges.py
import pandas as pd
from supabase import create_client, Client
import re

# --- Configuration ---
SUPABASE_URL = "https://jgsrsjwmywiirtibofth.supabase.co"
SUPABASE_SERVICE_KEY = "sb_secret_DVQha-CsYHFhTp71mFJSlw_9OA_QWNo" # Use your service key for this script
excel_file_path = 'GetInvolve/yuva_colleges2.xlsx'

# --- Supabase Client ---
supabase: Client = create_client(SUPABASE_URL, SUPABASE_SERVICE_KEY)

def get_initials(name):
    """Generates initials from a string."""
    # Remove parentheses and content within them
    name = re.sub(r'\(.*?\)', '', name)
    words = name.strip().split()
    if not words:
        return ""
    return "".join(word[0] for word in words).upper()

def main():
    try:
        # 1. Fetch existing zones from Supabase
        print("Fetching zones from Supabase...")
        zones_response = supabase.table('zones').select('id, zone_name, zone_code').execute()
        if not zones_response.data:
            print("Error: No zones found in the database. Please insert zones first.")
            return
        
        zones_map = {zone['zone_name'].lower(): zone for zone in zones_response.data}
        zone_code_map = {zone['zone_code'].lower(): zone for zone in zones_response.data}
        print(f"Found {len(zones_map)} zones.")

        # 2. Read the Excel file
        print(f"Reading Excel file: {excel_file_path}")
        xls = pd.ExcelFile(excel_file_path)
        
        all_colleges_to_insert = []
        zone_counters = {} # To track the unit number for each zone

        # 3. Process each sheet (each sheet is a zone)
        for sheet_name in xls.sheet_names:
            print(f"\nProcessing sheet (zone): '{sheet_name}'...")
            zone_info = zone_code_map.get(sheet_name.lower().strip())
            
            if not zone_info:
                print(f"  [Warning] Zone code '{sheet_name}' from Excel not found in database. Skipping sheet.")
                continue

            zone_id = zone_info['id']
            zone_initials = get_initials(zone_info['zone_name'])
            
            df = pd.read_excel(xls, sheet_name)
            
            # Assuming the college names are in a column named 'College Name'
            if 'College Name' not in df.columns:
                print(f"  [Error] 'College Name' column not found in sheet '{sheet_name}'. Skipping.")
                continue

            for college_name in df['College Name']:
                if pd.isna(college_name):
                    continue
                
                college_name = str(college_name).strip()
                
                # Increment counter for the zone
                zone_counters[zone_id] = zone_counters.get(zone_id, 0) + 1
                unit_number = str(zone_counters[zone_id]).zfill(3)
                
                # Generate the code
                college_initials = get_initials(college_name)
                college_code = f"{college_initials}{zone_initials}{unit_number}"

                college_record = {
                    "college_name": college_name,
                    "college_code": college_code,
                    "zone_id": zone_id,
                    "is_active": True
                }
                all_colleges_to_insert.append(college_record)
                print(f"  - Prepared: {college_name} -> {college_code}")

        # 4. Insert all collected data into Supabase
        if all_colleges_to_insert:
            print(f"\nAttempting to insert {len(all_colleges_to_insert)} colleges into Supabase...")
            insert_response = supabase.table('colleges').insert(all_colleges_to_insert).execute()
            
            if insert_response.data:
                print("✅ Successfully inserted colleges!")
            else:
                print("❌ Failed to insert colleges.")
                print("   Error:", insert_response)
        else:
            print("\nNo new colleges to insert.")

    except Exception as e:
        print(f"An error occurred: {e}")

if __name__ == "__main__":
    main()