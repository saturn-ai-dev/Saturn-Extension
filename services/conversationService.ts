
import { Tab } from '../types';

export const exportConversations = (tabs: Tab[]) => {
  const data = JSON.stringify(tabs, null, 2);
  const blob = new Blob([data], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'saturn-conversations.json';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
};

export const importConversations = (): Promise<Tab[]> => {
  return new Promise((resolve, reject) => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = (event) => {
      const target = event.target as HTMLInputElement;
      const file = target.files?.[0];
      if (file) {
        const reader = new FileReader();
        reader.onload = (e) => {
          try {
            const content = e.target?.result as string;
            const parsed = JSON.parse(content);
            // Basic validation to see if it's a valid export
            if (Array.isArray(parsed) && parsed.every(t => t.id && t.messages)) {
              resolve(parsed as Tab[]);
            } else {
              reject(new Error('Invalid conversation file format.'));
            }
          } catch (error) {
            reject(new Error('Failed to parse conversation file.'));
          }
        };
        reader.onerror = (error) => {
            reject(new Error('Failed to read file: ' + error));
        }
        reader.readAsText(file);
      } else {
        reject(new Error('No file selected.'));
      }
    };
    input.click();
  });
};
