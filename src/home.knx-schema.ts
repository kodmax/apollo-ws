import { DPT_ActiveEnergy, DPT_Alarm, DPT_Date, DPT_DateTime, DPT_Start, DPT_Switch, DPT_Time, DPT_Value_AirQuality, DPT_Value_Humidity, DPT_Value_Power, DPT_Value_Temp } from "js-knx"

export const lights = {
    "Salon i hol": {
        command: { address: "14/0/0", dataType: DPT_Switch }
    },

    "Jadalnia": {
        "Led Ściana": { 
            command: { address: "14/2/1", dataType: DPT_Switch },
            state: { address: "14/2/2", dataType: DPT_Switch }
        },
        "Led Główny": {
            command: { address: "14/2/6", dataType: DPT_Switch },
            state: { address: "14/2/7", dataType: DPT_Switch },        
        },
        "Lampa": {
            // ?
        }
    },

    "Kuchnia": {
        "Cała": {
            command: { address: "14/3/1", dataType: DPT_Switch },
            state: { address: "14/3/2", dataType: DPT_Switch }
        },
        "Led A": {
            command: { address: "14/3/6", dataType: DPT_Switch },
            state: { address: "14/3/7", dataType: DPT_Switch }
        },
        "Led B": {
            command: { address: "14/3/8", dataType: DPT_Switch },
            state: { address: "14/3/9", dataType: DPT_Switch }
        },
        "Lampa": {
            // ?
        }
    },

    "Lazienka": {
        "Główne": {
            command: { address: "14/4/2", dataType: DPT_Switch }
        },
        "Lustro": {
            command: { address: "14/4/5", dataType: DPT_Switch }
        },
        "Geberit": {
            command: { address: "14/4/8", dataType: DPT_Switch },
            state: { address: "14/4/10", dataType: DPT_Switch }
        },
        "Prysznic": {
            command:{ address: "14/4/9", dataType: DPT_Switch },
            state: { address: "14/4/11", dataType: DPT_Switch }
        }
    },

    "Hol": {
        "Salon Led": {
            command: { address: "14/5/2", dataType: DPT_Switch },
            state: { address: "14/5/3", dataType: DPT_Switch }
        },
        "Pralka": {
            command: { address: "14/5/7", dataType: DPT_Switch },
            state: { address: "14/5/8", dataType: DPT_Switch }
        },
        "Sypialnia Led": {
            command: { address: "14/5/9", dataType: DPT_Switch },
            state: { address: "14/5/10", dataType: DPT_Switch }
        },
    },

    "Salon": {
        "Cały": {
            command: { address: "14/6/4", dataType: DPT_Switch },
            state: { address: "14/6/5", dataType: DPT_Switch }
        },
        "Led TV": {
            command: { address: "14/6/9", dataType: DPT_Switch, relatedState: "14/6/10" },
            state: { address: "14/6/10", dataType: DPT_Switch }
        },
        "Led Sofa": {
            command: { address: "14/6/11", dataType: DPT_Switch },
            state: { address: "14/6/12", dataType: DPT_Switch }
        },
        "Lampa": {
            // gdzie jest lampa?
        }
    },

    "Sypialnia": {
        "Led A": {
            command: { address: "14/7/8", dataType: DPT_Switch },
            state: { address: "14/7/9", dataType: DPT_Switch },        
        },
        "Led B": {
            command: { address: "14/7/3", dataType: DPT_Switch },
            state: { address: "14/7/4", dataType: DPT_Switch },
        
        }
    }
}

export const dimming = {
    "Jadalnia.Jadalnia LED A Sciemnianie": { address: "14/2/3" },
    "Jadalnia.Jadalnia LED A Jasnosc absolutna": { address: "14/2/4" },
    "Jadalnia.Jadalnia LED A Jasnosc odczyt": { address: "14/2/5" },
    "Jadalnia.Jadalnia LED B Sciemnianie": { address: "14/2/8" },
    "Jadalnia.Jadalnia LED B Jasnosc absolutna": { address: "14/2/9" },
    "Jadalnia.Jadalnia LED B Jasnosc Odczyt": { address: "14/2/10" },
    "Kuchnia.Cala Kuchnia LED Sciemnianie": { address: "14/3/3" },
    "Kuchnia.Cala Kuchnia LED Jasnosc Absolutna": { address: "14/3/4" },
    "Kuchnia.Cala Kuchnia LED Jasnosc Odczyt": { address: "14/3/5" },
    "Lazienka.Lazienka LED Main Sciemniacz": { address: "14/4/1" },
    "Lazienka.Lazienka LED Secondary Sciemniacz": { address: "14/4/3" },
    "Lazienka.Lazienka LED Secondary On/Off": { address: "14/4/4" },
    "Lazienka.Lazienka LED Lustro Sciemniacz": { address: "14/4/6" },
    "Lazienka.Lazienka LED Cala Sciemnianie": { address: "14/4/7" },
    "Hol.Salon Hol LED Sciemnianie": { address: "14/5/4" },
    "Hol.Salon Hol LED Jasnosc absolutna": { address: "14/5/5" },
    "Hol.Salon Hol LED Jasnosc odczyt": { address: "14/5/6" },
    "Hol.Sypialnia LED Hol Sciemnianie": { address: "14/5/11" },
    "Salon LED B Jasnosc absolutna ": { address: "14/6/2" },
    "Salon LED B Jasnosc absolutna stan": { address: "14/6/3" },
    "Caly Salon LED Sciemnianie": { address: "14/6/6" },
    "Caly Salon LED Jasnosc absolutna": { address: "14/6/7" },
    "Caly Salon LED Jasnosc Odczyt": { address: "14/6/8" },
    "Sypialnia.Sypialnia LED B Sciemnianie": { address: "14/7/5" },
    "Sypialnia.Sypialnia LED B Jasnosc Absolutna": { address: "14/7/6" },
    "Sypialnia.Sypialnia LED B Jasnosc Odczyt": { address: "14/7/7" },
    "Sypialnia.Sypialnia LED A Sciemnianie": { address: "14/7/10" },
    "Sypialnia.Sypialnia LED A Jasnosc Absolutna": { address: "14/7/11" },
    "Sypialnia.Sypialnia LED A Jasnosc Odczyt": { address: "14/7/12" },
}

export const energy = {
    "RequestReadings": {
        command: { address: "5/0/0" } // ??
    },
    "InstantPowerDraw": {
        reading: { address: "5/0/1", dataType: DPT_Value_Power }
    },
    "Frequency": {
        reading: { address: "5/1/0" }
    },
    "Request Readings": {
        command: { address: "5/2/0" }
    },
    "Total": {
        reading: { address: "5/2/3", dataType: DPT_ActiveEnergy }
    },
    "Intermediate Consumption Meter": {
        "Start": { address: "5/2/1", dataType: DPT_Start },
        "Stop": { address: "5/2/4", dataType: DPT_Start },
        "Status": { address: "5/2/5", dataType: DPT_Start },
        "Reading": { address: "5/2/2", dataType: DPT_ActiveEnergy },    
    }
}

export const temp = {
    "Podloga lazienka temperatura": { address: "13/0/2", dataType: DPT_Value_Temp },
    "Tempertura Salon": { address: "15/0/0", dataType: DPT_Value_Temp },
    "Lazienka": { address: "15/0/1", dataType: DPT_Value_Temp },
    "Sypialnia przy loggi": { address: "15/0/2", dataType: DPT_Value_Temp },
    "Sypialnia sufit": { address: "15/0/4", dataType: DPT_Value_Temp },
    "Sypialnia lozko lewa": { address: "15/0/6", dataType: DPT_Value_Temp },
    "Sypialnia sofa?": { address: "15/0/7", dataType: DPT_Value_Temp },
    "Lazienka wlacznik": { address: "15/0/8", dataType: DPT_Value_Temp },
    "Sypialnia hol": { address: "15/0/9", dataType: DPT_Value_Temp },
}

export const airQuality = {
    "CO2": {
        reading: { address: "15/0/3", dataType: DPT_Value_AirQuality },
        alarmLevel1: { address: "15/1/0", dataType: DPT_Alarm },
        alarmLevel2: { address: "15/1/1", dataType: DPT_Alarm },
        alarmLevel3: { address: "15/1/2", dataType: DPT_Alarm }
    },
    "Wilgotność": {
        reading: { address: "15/0/5", dataType: DPT_Value_Humidity },
        alertHigh: { address: "15/1/3", dataType: DPT_Alarm },
        alertLow: { address: "15/1/4", dataType: DPT_Alarm }
    }
}

export const heatings = {
    "Podłoga Łazienka": {
        command: { address: "13/0/0", dataType: DPT_Switch },
        state: { address: "13/0/1", dataType: DPT_Switch },
        setPWM: { address: "13/0/3" },
        getPWM: { address: "13/0/4" },
    },
    "Grzejniki wodne": {
        "Salon ustawienie": { address: "13/1/0" },
        "Salon odczyt": { address: "13/1/1" },
        "Jadalnia ustawienie": { address: "13/1/2" },
        "Jadalnia odczyt": { address: "13/1/3" },
        "Sypialnia ustawienie": { address: "13/1/4" },
        "Sypialnia odczyt": { address: "13/1/5" },
        "Lazienka ustawienie": { address: "13/1/6" },
        "Lazienka odczyt": { address: "13/1/7" },
        "Pokoj dzienny Oba ustawienie": { address: "13/1/9" },    
    },
    "Grzejniki elektryczne (gniazdka)": {
        "Grzejniki elektryczne.Grzejniki Elektryczne Salon On/Off": { address: "13/2/0" },
        "Grzejniki elektryczne.Grzejnik elektryczny sypialnia on/off": { address: "13/2/1" },    
    },
    "Obecnosc sypialnia": { address: "13/4/0" },
    "Heating/Cooling Status": { address: "13/4/1" },
}

export const venting = {
    "Wentylatorki": {
        "Lazienka": {
            command: { address: "11/0/0", dataType: DPT_Switch },
            state: { address: "11/0/1", dataType: DPT_Switch }
        },
        "Kuchnia": {
            command: { address: "11/1/0", dataType: DPT_Switch },
            state: { address: "11/1/1", dataType: DPT_Switch }
        }
    },
    "Śmigła": {
        "Pokój dzienny": {
            command: { address: "12/0/0", dataType: DPT_Switch },
            state: { address: "12/0/1", dataType: DPT_Switch }
        
        },
        "Sypialnia": {
            command: { address: "12/1/0", dataType: DPT_Switch },
            state: { address: "12/1/1", dataType: DPT_Switch },
            command2: { address: "14/7/15", dataType: DPT_Switch },
            state2: { address: "14/7/16", dataType: DPT_Switch }
        }
    }
}

export const sockets = {
    "Salon Lewe On/Off": { address: "10/0/1" },
    "Salon Lewe Stan": { address: "10/0/2" },
    "Salon Prawe On/Off": { address: "10/0/3" },
    "Salon Prawe Stan": { address: "10/0/4" },
    "Jadalnia Lewe On/Off": { address: "10/0/0" },
    "Jadalnia Lewe stan": { address: "10/0/5" },
    "Jadalnia Prawe On/Off": { address: "10/0/6" },
    "Jadalnia Prawe stan": { address: "10/0/7" },
    "Sypialnia Lozko Prawe On/Off": { address: "10/1/0" },
    "Sypialnia Lozko Prawe Stan": { address: "10/1/1" },
    "Sypialnia Lozko Lewe On/Off": { address: "10/1/2" },
    "Sypialnia Lozko Lewe Stan": { address: "10/1/3" },
    "Sypialnia TV Lewe On/Off": { address: "10/1/4" },
    "Sypialnia TV Lewe Stan": { address: "10/1/5" },
    "Sypialnia TV Prawe On/Off": { address: "10/1/6" },
    "Sypialnia TV Prawe Stan": { address: "10/1/7" },
}

export const time = {
    "Now.DateTime.Set": { address: "1/0/1", dataType: DPT_DateTime },
    "Now.Date.Set": { address: "1/0/2", dataType: DPT_Date },
    "Now.Time.Set": { address: "1/0/3", dataType: DPT_Time },
}
