import json, os, joblib
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.linear_model import LogisticRegression
from sklearn.pipeline import Pipeline
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, f1_score

def train():
    texts, labels = [], []
    with open("data/examples.jsonl", "r", encoding="utf-8") as f:
        for line in f:
            if line.strip():
                item = json.loads(line)
                texts.append(item["text"])
                labels.append(item["label"])

    X_train, X_test, y_train, y_test = train_test_split(texts, labels, test_size=0.25, random_state=42, stratify=labels)
    pipe = Pipeline([
        ('tfidf', TfidfVectorizer(ngram_range=(1, 2))),
        ('clf', LogisticRegression(random_state=42))
    ])
    pipe.fit(X_train, y_train)
    preds = pipe.predict(X_test)
    os.makedirs("models", exist_ok=True)
    joblib.dump(pipe, "models/promptshield_model.joblib")
    print(f"Model trained. Accuracy: {accuracy_score(y_test, preds):.2f}, F1: {f1_score(y_test, preds, zero_division=0):.2f}")

if __name__ == "__main__":
    train()
