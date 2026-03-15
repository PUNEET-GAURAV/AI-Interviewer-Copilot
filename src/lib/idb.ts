// Utility for saving and loading large video Blobs using IndexedDB
// since localStorage has a 5MB limit.

const DB_NAME = 'InterviewVideosDB';
const STORE_NAME = 'videos';

export const initDB = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);
    
    request.onerror = () => reject('Error opening IndexedDB');
    
    request.onsuccess = () => resolve(request.result);
    
    request.onupgradeneeded = (event: any) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

export const saveVideoToIDB = async (videoId: string, videoBlob: Blob): Promise<void> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(videoBlob, videoId);
    
    request.onsuccess = () => resolve();
    request.onerror = () => reject('Error saving video to IndexedDB');
  });
};

export const getVideoFromIDB = async (videoId: string): Promise<Blob | null> => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(videoId);
    
    request.onsuccess = () => {
      resolve(request.result || null);
    };
    request.onerror = () => reject('Error retrieving video from IndexedDB');
  });
};
