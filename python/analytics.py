"""
Optional Python analytics script for SIS.
Requires: pip install pymongo pandas
"""

from pymongo import MongoClient
import pandas as pd


def main():
    client = MongoClient("mongodb://127.0.0.1:27017")
    db = client["sis_db"]
    rows = list(db.enrollments.find({}, {"_id": 0, "grade": 1, "attendance": 1}))
    frame = pd.DataFrame(rows)
    if frame.empty:
        print("No enrollment data found")
        return
    print("Enrollment analytics")
    print(frame.describe(include="all"))


if __name__ == "__main__":
    main()
