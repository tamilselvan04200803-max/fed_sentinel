"""
National Synthetic Fleet Generator for FedSentinel-Health
Generates 50, 100, 500, or 1000+ simulated hospital nodes across Indian states and districts
for large-scale national security command center visualization and stress testing.
"""

from __future__ import annotations
import random
from typing import Dict, List, Any
from datetime import datetime, timezone


INDIAN_STATES = [
    {
        "state": "Maharashtra",
        "districts": ["Mumbai", "Pune", "Nagpur", "Nashik", "Thane"],
        "lat_range": (18.5, 20.0),
        "lng_range": (72.8, 79.0),
        "org_suffix": "Maharashtra State Health Network",
    },
    {
        "state": "Karnataka",
        "districts": ["Bengaluru Urban", "Mysuru", "Mangaluru", "Hubballi", "Belagavi"],
        "lat_range": (12.8, 15.3),
        "lng_range": (74.8, 77.6),
        "org_suffix": "Karnataka Clinical AI Consortium",
    },
    {
        "state": "Delhi NCR",
        "districts": ["New Delhi", "South Delhi", "Gurugram", "Noida", "Faridabad"],
        "lat_range": (28.4, 28.7),
        "lng_range": (77.0, 77.3),
        "org_suffix": "NCR Tertiary Radiology Group",
    },
    {
        "state": "Tamil Nadu",
        "districts": ["Chennai", "Coimbatore", "Madurai", "Tiruchirappalli", "Salem"],
        "lat_range": (9.9, 13.1),
        "lng_range": (78.1, 80.2),
        "org_suffix": "Tamil Nadu Diagnostic Healthcare",
    },
    {
        "state": "Telangana",
        "districts": ["Hyderabad", "Warangal", "Nizamabad", "Karimnagar", "Khammam"],
        "lat_range": (17.3, 18.0),
        "lng_range": (78.3, 79.6),
        "org_suffix": "Telangana AI Enclave Association",
    },
    {
        "state": "West Bengal",
        "districts": ["Kolkata", "Howrah", "Siliguri", "Durgapur", "Asansol"],
        "lat_range": (22.5, 26.7),
        "lng_range": (88.3, 88.4),
        "org_suffix": "Bengal Medical Research Enclave",
    },
    {
        "state": "Gujarat",
        "districts": ["Ahmedabad", "Surat", "Vadodara", "Rajkot", "Bhavnagar"],
        "lat_range": (21.1, 23.0),
        "lng_range": (72.5, 73.2),
        "org_suffix": "Gujarat General Hospital Network",
    },
]

HOSPITAL_PREFIXES = [
    "Apollo", "Fortis", "Max Super Specialty", "Manipal", "Narayana Health",
    "AIMMS Regional", "St. John's", "KIMS Medical", "Lilavati", "Kokilaben",
    "Medanta Clinical", "Sir Ganga Ram", "BIMS Institute", "Care Hospitals", "Cloudnine"
]

SPECIALTIES = [
    "Pulmonology & Radiology", "Pathology & Oncology", "Emergency Radiology",
    "Diagnostic Imaging", "Clinical Research & AI", "Neuroradiology", "Pediatric Imaging"
]

ENCLAVE_TYPES = [
    "Intel SGX Enclave", "AMD SEV-SNP", "AWS Nitro Enclaves", "Apple Secure Enclave"
]


class NationalFleetGenerator:
    """Generates synthetic national fleet nodes across Indian states."""

    @staticmethod
    def generate_fleet(count: int = 100, seed: int = 42) -> List[Dict[str, Any]]:
        """Generates `count` synthetic facility nodes with geolocations and trust statuses."""
        random.seed(seed)
        facilities = []

        for i in range(1, count + 1):
            st = random.choice(INDIAN_STATES)
            district = random.choice(st["districts"])
            prefix = random.choice(HOSPITAL_PREFIXES)
            
            facility_id = f"H{i:03d}" if i <= 999 else f"H{i}"
            hfr_id = f"IN-HFR-{random.randint(1000000, 9999999)}"
            
            lat = round(random.uniform(*st["lat_range"]), 4)
            lng = round(random.uniform(*st["lng_range"]), 4)

            # Assign trust status distribution: ~85% ACTIVE, ~10% SUSPICIOUS, ~5% QUARANTINED
            r = random.random()
            if r > 0.93:
                status = "QUARANTINED"
                trust_score = round(random.uniform(15.0, 28.0), 1)
                anomaly_score = round(random.uniform(0.65, 0.95), 2)
            elif r > 0.83:
                status = "SUSPICIOUS"
                trust_score = round(random.uniform(35.0, 68.0), 1)
                anomaly_score = round(random.uniform(0.35, 0.55), 2)
            else:
                status = "ACTIVE"
                trust_score = round(random.uniform(88.0, 99.0), 1)
                anomaly_score = round(random.uniform(0.01, 0.15), 2)

            facility = {
                "client_id": facility_id,
                "name": f"{prefix} Hospital - {district}",
                "hfr_reference_id": hfr_id,
                "organization_name": st["org_suffix"],
                "status": status,
                "trust_score": trust_score,
                "anomaly_score": anomaly_score,
                "samples_count": random.randint(450, 3200),
                "historical_anomalies": 1 if status != "ACTIVE" else 0,
                "last_active_round": random.randint(18, 25),
                "enclave_type": random.choice(ENCLAVE_TYPES),
                "department": random.choice(SPECIALTIES),
                "state": st["state"],
                "district": district,
                "city": district,
                "latitude": lat,
                "longitude": lng,
                "is_synthetic": True,
                "environment": "SIMULATED / DEMO FLEET",
            }
            facilities.append(facility)

        return facilities
