import tweepy
import time
import requests
from datetime import datetime

API_KEY = "KgIdFF0ry9sjRW04hGlFTBdeI"
API_SECRET = "6pKSovlZ7SD6RmQDlS7WfQv8naFrLGUxvuFXAjzp1TqyM8VWdu"
ACCESS_TOKEN = "2046322718883344384-o6yxMXzTv1fbXCNaC3Xk4IPIO3HxJd"
ACCESS_SECRET = "0JoMaTXZreQ1aQ86YmdxS0SQZsDaQiZO6DUl7AmNx9G3A"

client = tweepy.Client(
    consumer_key=API_KEY,
    consumer_secret=API_SECRET,
    access_token=ACCESS_TOKEN,
    access_token_secret=ACCESS_SECRET
)

WEBSITE_URL = "https://explainingtheworld.com"
CHECK_INTERVAL = 3600
posted_articles = set()

THREADS = {
    "taiwan": [
        "The question everyone is asking about Taiwan is the wrong one.\n\nWill Xi invade? Almost certainly not.\n\nThe real question: what does Xi need to do to make Taiwan accept a settlement WITHOUT invading?\n\nA thread. 🧵",
        "Xi Jinping has watched Putin stake his legacy on a 72-hour war that became a 4-year quagmire.\n\nHe has read the same casualty estimates American admirals have.\n\nHe has a far more attractive option than invasion. And he is already using it.",
        "Amphibious assault is the hardest operation a modern military can attempt.\n\nThe PLA has not fought a real war since its 1979 disaster against Vietnam.\n\nIts joint command structure was rebuilt only in 2016 and has NEVER been tested under fire.",
        "Even generous estimates put China's first-wave amphibious capacity at ~25,000 troops.\n\nThey would land against 169,000 active Taiwanese personnel + 2.3M reservists, fighting on home terrain, with 70 years of fortification.",
        "The lesson Beijing took from Kyiv was not 'invade faster.'\n\nIt was: don't invade at all if there's another way.\n\nThere IS another way. And it has already begun.",
        "The real war is a blockade.\n\nChina announces a 'customs inspection regime' — legally framed as domestic enforcement, not an act of war.\n\nInsurance markets collapse. Container traffic drops 70% in a week.",
        "Taiwan has roughly 11 days of natural gas reserves.\n\nEleven.\n\nNo invasion needed. Just patience and a chokehold dressed in legal language.",
        "Taiwan's biggest vulnerability isn't its beaches.\n\nIt's its own parliament.\n\nThe KMT has spent 2 years gutting the defense budget — submarines, drones, asymmetric warfare. All cut.",
        "Why invade an island when its own parliament is doing your work for you?\n\nThis is coercion in the long game.\n\nDon't break the will to resist with bombs. Hollow it out with patience.",
        "The timeline:\n\n2025-26: Gray-zone escalation\n2027-30: >50% probability of major blockade event\n2030-35: Political endgame\n\nThe war has already started. It just doesn't look like a war.",
        "The war for Taiwan will not be a Pacific D-Day.\n\nIt will be slow strangulation — fought in shipping lanes, cables, and parliamentary committees.\n\nFull analysis: https://explainingtheworld.com/taiwan.html"
    ]
}

def post_thread(thread_key):
    thread = THREADS.get(thread_key)
    if not thread:
        return None
    print(f"\n[{datetime.now()}] Posting thread: {thread_key}")
    previous_id = None
    first_tweet_id = None
    for i, tweet in enumerate(thread):
        try:
            if previous_id is None:
                response = client.create_tweet(text=tweet)
            else:
                response = client.create_tweet(
                    text=tweet,
                    in_reply_to_tweet_id=previous_id
                )
            previous_id = response.data["id"]
            if i == 0:
                first_tweet_id = previous_id
            print(f"Tweet {i+1}/{len(thread)} posted.")
            time.sleep(3)
        except Exception as e:
            print(f"Error on tweet {i+1}: {e}")
            return None
    print(f"Thread complete.")
    return first_tweet_id

def check_new_articles():
    try:
        response = requests.get(f"{WEBSITE_URL}/articles.html", timeout=10)
        content = response.text
        if "taiwan.html" in content and "taiwan" not in posted_articles:
            print(f"[{datetime.now()}] New article detected: Taiwan")
            tweet_id = post_thread("taiwan")
            if tweet_id:
                posted_articles.add("taiwan")
                print(f"Scheduling repost in 6 hours.")
                time.sleep(21600)
                try:
                    client.create_tweet(
                        text="If you missed this earlier — the most important thread on Taiwan you will read this year.\n\nhttps://explainingtheworld.com/taiwan.html"
                    )
                    print(f"Repost done.")
                except Exception as e:
                    print(f"Repost error: {e}")
    except Exception as e:
        print(f"Check error: {e}")

def main():
    print(f"[{datetime.now()}] ETW X Automation started.")
    print(f"Monitoring: {WEBSITE_URL}")
    print(f"Check interval: every {CHECK_INTERVAL//60} minutes\n")
    while True:
        check_new_articles()
        time.sleep(CHECK_INTERVAL)

if __name__ == "__main__":
    main()