import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

export function BookMarker() {
  const [url, setUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Live data query for bookmarks
  const {
    data: bookmarks,
    error: bookmarksError,
  } = useQuery(
    queryClient.bookmarker.storage.live.list.experimental_liveOptions()
  );

  const { data: categories } = useQuery(
    queryClient.bookmarker.storage.getCategories.queryOptions()
  );

  // Mutations
  const { mutate: createBookmark, isPending: isCreating } = useMutation(
    queryClient.bookmarker.storage.create.mutationOptions()
  );

  const {
    mutate: categorize,
    isPending: isCategorizing,
    error: categorizeError,
  } = useMutation(queryClient.bookmarker.categorize.categorize.mutationOptions());

  const handleAddBookmark = () => {
    if (!url.trim()) return;
    const trimmedUrl = url.trim();

    // Try to validate URL format
    let validUrl: string;
    try {
      validUrl = new URL(trimmedUrl).toString();
    } catch {
      validUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;
    }

    categorize(
      { url: validUrl },
      {
        onSuccess: (result) => {
          createBookmark({
            url: validUrl,
            title: result.title,
            category: result.category,
          });
          setUrl("");
        },
      }
    );
  };

  // Filter bookmarks by selected category
  const filteredBookmarks = useMemo(() => {
    if (!bookmarks) return [];
    if (!selectedCategory) return bookmarks;
    return bookmarks.filter((b) => b.category === selectedCategory);
  }, [bookmarks, selectedCategory]);

  const groupByCategory = useMemo(() => {
    if (!filteredBookmarks) return {};
    const grouped: Record<string, typeof filteredBookmarks> = {};
    for (const bm of filteredBookmarks) {
      if (!grouped[bm.category]) grouped[bm.category] = [];
      grouped[bm.category].push(bm);
    }
    return grouped;
  }, [filteredBookmarks]);

  const groupedEntries = useMemo(
    () => Object.entries(groupByCategory).sort(([a], [b]) => a.localeCompare(b)),
    [groupByCategory]
  );

  const isProcessing = isCreating || isCategorizing;

  if (bookmarksError) {
    console.error("Bookmarks error:", bookmarksError);
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">BookMarker</h1>
        <p className="text-gray-500">
          Paste a URL and it will be automatically categorized for you.
        </p>
      </div>

      {/* URL Input */}
      <div className="flex gap-3">
        <input
          className="flex-1 p-3 border border-gray-300 rounded-md text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          type="text"
          placeholder="Paste a URL here..."
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && url.trim() && !isProcessing) {
              handleAddBookmark();
            }
          }}
        />
        <button
          className="px-6 py-3 bg-blue-600 text-white rounded-md font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          onClick={handleAddBookmark}
          disabled={!url.trim() || isProcessing}
        >
          {isProcessing ? "Adding..." : "Add Bookmark"}
        </button>
      </div>

      {categorizeError && (
        <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-md text-sm">
          Failed to categorize URL. It will be saved under "Other".
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-6">
        {!bookmarks && !bookmarksError && (
          <div className="text-center py-16 text-gray-400">
            <p>Loading...</p>
          </div>
        )}

        {bookmarks && bookmarks.length === 0 && (
          <div className="text-center py-16 text-gray-400">
            <div className="text-5xl mb-4">+</div>
            <p className="text-lg">No bookmarks yet. Paste a URL above to get started.</p>
          </div>
        )}

        {bookmarks && bookmarks.length > 0 && (
          <>
            {/* Category Pills */}
            {Array.isArray(categories) && categories.length > 0 && (
              <div className="flex flex-wrap gap-2">
                <button
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === null
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                </button>
                {categories.map((cat) => (
                  <button
                    key={cat}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === cat
                        ? "bg-blue-600 text-white"
                        : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                    }`}
                    onClick={() => setSelectedCategory(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            )}

            {groupedEntries.map(([category, items]) => (
              <div key={category}>
                <h2 className="text-lg font-semibold text-gray-800 mb-3 border-b border-gray-200 pb-2">
                  {category}
                </h2>
                <div className="space-y-2">
                  {items.map((bm) => (
                    <div
                      key={bm.id}
                      className="flex items-start justify-between p-3 bg-white border border-gray-200 rounded-lg hover:border-gray-300 transition-colors group"
                    >
                      <div className="min-w-0 flex-1">
                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium truncate block"
                        >
                          {bm.title}
                        </a>
                        <p className="text-sm text-gray-400 truncate mt-0.5">
                          {bm.url}
                        </p>
                      </div>
                      <button
                        className="ml-3 p-1 text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0 cursor-pointer"
                        onClick={() => {
                          rpcClient.bookmarker.storage.remove(bm.id);
                        }}
                        title="Remove bookmark"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-5 w-5"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z"
                            clipRule="evenodd"
                          />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </>
        )}
      </div>
    </div>
  );
}