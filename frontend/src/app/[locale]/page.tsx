'use client';

import { useState, useEffect, useTransition } from 'react';
import { fetchPosts, createPost } from '@/lib/api';

interface Post {
  id: string;
  content: string;
  locale: string;
  createdAt: string;
}

export default function WaytoHome({ params }: { params: { locale: string } }) {
  const { locale } = params;
  const [posts, setPosts] = useState<Post[]>([]);
  const [content, setContent] = useState('');
  const [isPending, startTransition] = useTransition();

  const isAmharic = locale === 'am';

  useEffect(() => {
    fetchPosts().then(setPosts).catch(console.error);
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim()) return;

    startTransition(async () => {
      try {
        const newPost = await createPost(content, locale);
        setPosts([newPost, ...posts]);
        setContent('');
      } catch (err) {
        console.error(err);
      }
    });
  };

  return (
    <main className="min-h-screen bg-gray-50 text-gray-900 p-6 md:p-12">
      <div className="max-w-3xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-black text-indigo-600">Wayto</h1>
          <div className="flex gap-2">
            <a href="/en" className="px-3 py-1 bg-white border rounded text-sm font-medium shadow-sm hover:bg-gray-100">English</a>
            <a href="/am" className="px-3 py-1 bg-white border rounded text-sm font-medium shadow-sm hover:bg-gray-100">አማርኛ</a>
          </div>
        </div>

        <div className="bg-white p-8 rounded-2xl shadow-sm border mb-8 text-center">
          <h2 className="text-2xl font-bold mb-2">
            {isAmharic ? 'እንኳን ወደ ዌይቶ በደህና መጡ' : 'Welcome to Wayto'}
          </h2>
          <p className="text-gray-600">
            {isAmharic ? 'ይገናኙ፣ ያጋሩ እና ማህበረሰብ ይገንቡ።' : 'Connect, share, and build community together.'}
          </p>
        </div>

        <div className="bg-white p-6 rounded-2xl shadow-sm border mb-8">
          <h3 className="text-lg font-semibold mb-4">
            {isAmharic ? 'የማህበረሰብ ምግብ' : 'Community Feed'}
          </h3>
          <form onSubmit={handleSubmit}>
            <textarea 
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={isAmharic ? 'በልብዎ ውስጥ ያለው ምንድን ነው?' : 'What\'s on your mind?'}
              className="w-full p-3 border rounded-xl resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
              rows={3}
            />
            <div className="flex justify-end">
              <button 
                type="submit" 
                disabled={isPending}
                className="bg-indigo-600 text-white px-5 py-2 rounded-xl font-medium hover:bg-indigo-700 transition disabled:opacity-50"
              >
                {isPending ? '...' : (isAmharic ? 'ለጥፍ' : 'Post')}
              </button>
            </div>
          </form>
        </div>

        {/* Display Posts */}
        <div className="space-y-4">
          {posts.map((post) => (
            <div key={post.id} className="bg-white p-5 rounded-2xl shadow-sm border">
              <p className="text-gray-800">{post.content}</p>
              <span className="text-xs text-gray-400 mt-2 block">
                {new Date(post.createdAt).toLocaleString()}
              </span>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}