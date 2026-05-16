import os
import re
import json
import urllib.request
import urllib.error
import pandas as pd
from bs4 import BeautifulSoup

# This script fetches and processes all the data for the SIMECQ dashboard.
RACES = [
    {"id": "gp-milha-de-queijas", "event_id": 1137},
    {"id": "gp-cruz-quebrada", "event_id": 1138},
    {"id": "gp-ribeira-da-lage", "event_id": 1141},
    {"id": "gp-leiao", "event_id": 1142},
    {"id": "gp-valejas", "event_id": 1139},
    {"id": "gp-leceia", "event_id": 1144},
    {"id": "gp-queluz-de-baixo", "event_id": 1140},
    {"id": "gp-caxias", "event_id": 1143},
    {"id": "gp-linda-a-pastora", "event_id": 1146},
    {"id": "gp-outurela", "event_id": 1145}
]

# Note: The easiest way to get the event_id for the download is to look at the /classificacoes/gp-XXX page.
# If a race hasn't happened, it will not be processing it here.

OVERALL_XLS_URL = 'https://trofeu.oeiras.pt/download-classificacoes-edicao/43-trofeu-cm-oeiras'
CLUB_NAME_MATCH = "Sociedade de Instrução Musical e Escolar Cruz Quebradense (SIMECQ)"

def fetch_html(url):
    try:
        req = urllib.request.Request(url, headers={'User-Agent': 'Mozilla/5.0'})
        return urllib.request.urlopen(req, timeout=10).read().decode('utf-8')
    except Exception as e:
        print(f"Error fetching {url}: {e}")
        return ""

def process_race(race):
    dataset = []
    colectivo = []
    event_date = None
    
    # 1. Download classificacoes
    xls_url = f"https://trofeu.oeiras.pt/download-classificacoes-evento/{race['event_id']}"
    file_name = f"{race['id']}.xlsx"
    try:
        urllib.request.urlretrieve(xls_url, file_name)
    except:
        print(f"Could not download {xls_url}. Skipping {race['id']}.")
        return None, None
        
    try:
        # 2. Extract Colectivo (Club limits for this race)
        df_club = pd.read_excel(file_name, sheet_name='Colectivo', header=2)
        # Typically Posição, Clube, Pontos
        for _, row in df_club.dropna(subset=['Posição', 'Pontos']).iterrows():
            club_str = str(row.get('Clube/Equipa', '')).strip()
            if not club_str and 'Clube / Equipa' in row:
                club_str = str(row.get('Clube / Equipa', '')).strip()
            if club_str:
                colectivo.append({
                    "posicao": int(row['Posição']),
                    "clube": club_str,
                    "pontos": float(row['Pontos'])
                })
        
        # 3. Extract Atletas
        df_ath = pd.read_excel(file_name, sheet_name='Atletas', header=None)
        
        # Parse logic: The format has Escalão interspersed.
        current_escalao = "Desconhecido"
        for i, row in df_ath.iterrows():
            # If row 0 is not null, it might be an escalao title or header
            val = str(row[0]).strip()
            if val == 'nan' or val == '' or 'Posição' in val:
                continue
            
            if len(row) > 1 and str(row[1]) == 'nan' and str(row[2]) == 'nan':
                # Possibly escalao header? Wait, in the CSV export, it was:
                # Sub 10 - Masculinos;Sub 10 - Masculinos;...
                pass
            
            # The pattern is: If row[0] is not a number and it's not 'Posição', it might be Escalão
            if not val.isdigit() and 'Posição' not in val and 'Troféu' not in val:
                 current_escalao = val
            elif val.isdigit():
                 # It's an athlete!
                 pos = int(val)
                 dorsal = str(row[1]).strip()
                 atleta = str(row[2]).strip()
                 clube = str(row[3]).strip()
                 pontos = float(row[4]) if not pd.isna(row[4]) else 0
                 
                 dataset.append({
                     "escalao": current_escalao,
                     "posicao": pos,
                     "dorsal": dorsal,
                     "nome": atleta,
                     "clube": clube,
                     "pontos": pontos,
                     "tempo": None
                 })
    except Exception as e:
        print(f"Error parsing Excel for {race['id']}: {e}")
        
    # 4. Fetch times and Prova names from HTML
    print(f"Fetching HTML times for {race['id']}")
    base_url = f"https://trofeu.oeiras.pt/classificacoes/{race['id']}"
    html = fetch_html(base_url)
    soup = BeautifulSoup(html, 'html.parser')

    page_text = soup.get_text(" ", strip=True)
    date_match = re.search(r'\b(\d{2}/\d{2}/\d{4})\b', page_text)
    if date_match:
        event_date = date_match.group(1)

    links = soup.find_all('a', href=True)
    times_map = {}
    for a in links:
        if '/prova/' in a['href']:
            prova_url = f"https://trofeu.oeiras.pt{a['href']}" if a['href'].startswith('/') else a['href']
            
            # Extract Prova Name from the parent div text if possible (e.g. "Prova 1")
            prova_name = "Desconhecida"
            parent = a.find_parent('div', class_='text-left') or a.parent.parent
            if parent:
                parent_text = parent.text.strip().replace('\n', ' ')
                m = re.search(r'(Prova\s+\d+)', parent_text, re.IGNORECASE)
                if m:
                    prova_name = m.group(1)

            p_html = fetch_html(prova_url)
            p_soup = BeautifulSoup(p_html, 'html.parser')
            
            for tr in p_soup.find_all('tr'):
                tds = tr.find_all('td')
                if len(tds) >= 3:
                    d_pos = tds[0].text.strip()
                    d_time = tds[1].text.strip()
                    d_dorsal = tds[2].text.strip()
                    if d_dorsal.isdigit():
                        times_map[d_dorsal] = {"tempo": d_time, "prova": prova_name}
                        
    # 5. Merge Times and Provas, filter for SIMECQ
    simecq_athletes = []
    for d in dataset:
        if d['dorsal'] in times_map:
            d['tempo'] = times_map[d['dorsal']]['tempo']
            d['prova'] = times_map[d['dorsal']]['prova']
        else:
            d['prova'] = "Desconhecida"
            
        if d['clube'].lower() == CLUB_NAME_MATCH.lower() or "simecq" in d['clube'].lower():
            simecq_athletes.append(d)
            
    # Cleanup
    if os.path.exists(file_name):
        os.remove(file_name)
        
    return simecq_athletes, colectivo, event_date

def main():
    print("Starting data extraction...")
    final_data = {
        "races": [],
        "overall_club_rankings": [],
        "best_athletes": [] # Requires overall classification
    }
    
    # Process each passed race
    for race in RACES:
        print(f"Processing race: {race['id']}")
        athletes, club_rank, event_date = process_race(race)
        if athletes is not None:
            final_data["races"].append({
                "id": race["id"],
                "event_date": event_date,
                "simecq_results": athletes,
                "club_rankings": club_rank
            })
            
    # Download and process Overall Classification
    print("Processing overall standings...")
    try:
        urllib.request.urlretrieve(OVERALL_XLS_URL, "overall.xlsx")
        df_overall = pd.read_excel("overall.xlsx", sheet_name='Colectivo', header=2)
        for _, row in df_overall.dropna(subset=['Posição', 'Pontos']).iterrows():
            club_str = str(row.get('Clube/Equipa', '')).strip()
            if not club_str and 'Clube / Equipa' in row:
                club_str = str(row.get('Clube / Equipa', '')).strip()
            if club_str:
                final_data["overall_club_rankings"].append({
                    "posicao": int(row['Posição']),
                    "clube": club_str,
                    "pontos": float(row['Pontos'])
                })
        
        # Read overall athletes to calculate 'best athletes' and 'participations'
        df_overall_ath = pd.read_excel("overall.xlsx", sheet_name='Atletas', header=None)
        
        global_athletes = {}
        current_escalao = "Desconhecido"
        escalao_pontos_seen = set()
        for i, row in df_overall_ath.iterrows():
            val = str(row[0]).strip()
            
            if val == 'nan' or val == '' or 'Posição' in val:
                continue
                
            if not val.isdigit() and 'Posição' not in val and 'Troféu' not in val:
                 current_escalao = val
                 escalao_pontos_seen = set()
            elif val.isdigit():
                 clube = str(row[3]).strip()
                 pontos = float(row[4]) if not pd.isna(row[4]) else 0
                 posicao = int(val)
                 
                 escalao_pontos_seen.add(pontos)
                 
                 if "simecq" in clube.lower() or clube.lower() == CLUB_NAME_MATCH.lower():
                     dorsal = str(row[1]).strip()
                     
                     higher_points = [p for p in escalao_pontos_seen if p > pontos]
                     pontos_proximo = min(higher_points) if higher_points else pontos
                     pontos_falta = pontos_proximo - pontos if higher_points else 0
                     
                     if dorsal not in global_athletes:
                         global_athletes[dorsal] = {
                             "dorsal": dorsal,
                             "nome": str(row[2]).strip(),
                             "pontos": pontos,
                             "participacoes": 0,
                             "escalao": current_escalao,
                             "posicao_escalao": posicao,
                             "pontos_falta_proximo": pontos_falta
                         }
        
        # Count participations accurately by verifying in our processed races
        for r in final_data["races"]:
            for ath in r["simecq_results"]:
                dorsal = ath["dorsal"]
                if dorsal in global_athletes:
                    global_athletes[dorsal]["participacoes"] += 1
                else: 
                     global_athletes[dorsal] = {
                         "dorsal": dorsal,
                         "nome": ath["nome"],
                         "pontos": ath["pontos"],
                         "participacoes": 1,
                         "escalao": ath["escalao"],
                         "posicao_escalao": 9999, # Not in overall top
                         "pontos_falta_proximo": 0
                     }
                     
        sorted_best = sorted(global_athletes.values(), key=lambda x: x["posicao_escalao"])
        final_data["best_athletes"] = sorted_best
        
        if os.path.exists("overall.xlsx"):
            os.remove("overall.xlsx")
            
    except Exception as e:
        print(f"Error processing overall standings: {e}")

    # Ensure src/data exists
    os.makedirs("src/data", exist_ok=True)
    with open("src/data/dashboard_data.json", "w", encoding="utf-8") as f:
        json.dump(final_data, f, indent=2, ensure_ascii=False)
        
    print("Data extraction complete! Saved to src/data/dashboard_data.json")

if __name__ == "__main__":
    main()
