import { useState, useMemo } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { queryClient, rpcClient } from "@/client/rpc-client";

const CATEGORY_ICONS: Record<string, string> = {
  News: "📰",
  Technology: "💻",
  Development: "⚡",
  Science: "🔬",
  Education: "📚",
  Entertainment: "🎬",
  "Social Media": "💬",
  Shopping: "🛒",
  Finance: "💰",
  Health: "🏥",
  Travel: "✈️",
  Food: "🍔",
  Sports: "⚽",
  Reference: "📖",
  Tools: "🔧",
  Other: "📌",
};

const CATEGORY_COLORS: Record<string, string> = {
  News: "bg-red-100 text-red-700",
  Technology: "bg-indigo-100 text-indigo-700",
  Development: "bg-violet-100 text-violet-700",
  Science: "bg-teal-100 text-teal-700",
  Education: "bg-amber-100 text-amber-700",
  Entertainment: "bg-pink-100 text-pink-700",
  "Social Media": "bg-sky-100 text-sky-700",
  Shopping: "bg-orange-100 text-orange-700",
  Finance: "bg-emerald-100 text-emerald-700",
  Health: "bg-rose-100 text-rose-700",
  Travel: "bg-cyan-100 text-cyan-700",
  Food: "bg-yellow-100 text-yellow-700",
  Sports: "bg-green-100 text-green-700",
  Reference: "bg-slate-100 text-slate-700",
  Tools: "bg-stone-100 text-stone-700",
  Other: "bg-gray-100 text-gray-600",
};

function FaviconImage({ url }: { url: string }) {
  const hostname = new URL(url).hostname;
  return (
    <img
      src={`https://icons.duckduckgo.com/ip3/${hostname}.ico`}
      alt=""
      className="w-5 h-5 rounded flex-shrink-0"
      onError={(e) => {
        (e.target as HTMLImageElement).style.display = "none";
      }}
    />
  );
}

export function BookMarker() {
  const [url, setUrl] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [urlError, setUrlError] = useState("");

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

    let validUrl: string;
    try {
      validUrl = new URL(trimmedUrl).toString();
      if (!validUrl.startsWith("http://") && !validUrl.startsWith("https://")) {
        setUrlError("Please enter a valid URL starting with http:// or https://");
        return;
      }
    } catch {
      try {
        validUrl = new URL(`https://${trimmedUrl}`).toString();
        const hostname = new URL(validUrl).hostname;
        if (!hostname.includes(".")) {
          setUrlError("Please enter a valid URL (e.g. https://example.com)");
          return;
        }
      } catch {
        setUrlError("Please enter a valid URL (e.g. https://example.com)");
        return;
      }
    }

    setUrlError("");

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

  const totalBookmarks = bookmarks?.length ?? 0;
  const totalCategories = Array.isArray(categories) ? categories.length : 0;

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-8">
      {/* Header */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700 p-8 text-white">
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
        <div className="absolute bottom-0 left-1/2 w-48 h-48 bg-white/5 rounded-full translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-white/20 backdrop-blur rounded-xl flex items-center justify-center text-xl">
              🔖
            </div>
            <h1 className="text-3xl font-bold">BookMarker</h1>
          </div>
          <p className="text-blue-100 max-w-md">
            Save and organize your favorite links. URLs are automatically categorized using AI.
          </p>
          {totalBookmarks > 0 && (
            <div className="flex gap-4 mt-5">
              <div className="bg-white/15 backdrop-blur rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{totalBookmarks}</div>
                <div className="text-xs text-blue-200">Bookmarks</div>
              </div>
              <div className="bg-white/15 backdrop-blur rounded-lg px-4 py-2">
                <div className="text-2xl font-bold">{totalCategories}</div>
                <div className="text-xs text-blue-200">Categories</div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* URL Input */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
              </svg>
            </div>
            <input
              className={`w-full pl-10 pr-4 py-3 border rounded-xl text-base focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all ${
                urlError ? "border-red-300 bg-red-50" : "border-gray-200 bg-gray-50 focus:bg-white"
              }`}
              type="text"
              placeholder="Paste a URL here..."
              value={url}
              onChange={(e) => {
                setUrl(e.target.value);
                if (urlError) setUrlError("");
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && url.trim() && !isProcessing) {
                  handleAddBookmark();
                }
              }}
            />
          </div>
          <button
            className="px-5 py-3 bg-blue-600 text-white rounded-xl font-medium hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 shadow-sm shadow-blue-200 flex items-center gap-2"
            onClick={handleAddBookmark}
            disabled={!url.trim() || isProcessing}
          >
            {isProcessing ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                </svg>
                Adding...
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                Add Bookmark
              </>
            )}
          </button>
        </div>
        {urlError && (
          <p className="text-red-500 text-sm mt-2 ml-1">{urlError}</p>
        )}
      </div>

      {categorizeError && (
        <div className="p-4 bg-amber-50 border border-amber-200 text-amber-800 rounded-xl text-sm flex items-center gap-2">
          <svg className="h-5 w-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.98-1.426 1.324-2.598l-6.858-4.572a2 2 0 01-2.448 0l-6.858 4.572C5.042 17.574 6.482 19 8.022 19z" />
          </svg>
          Failed to categorize URL. It will be saved under "Other".
        </div>
      )}

      {/* Bookmarks List */}
      <div className="space-y-6">
        {!bookmarks && !bookmarksError && (
          <div className="flex justify-center py-16">
            <div className="flex items-center gap-2 text-gray-400">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              Loading bookmarks...
            </div>
          </div>
        )}

        {bookmarks && bookmarks.length === 0 && (
          <div className="text-center py-20">
            <div className="inline-flex items-center justify-center w-20 h-20 bg-blue-50 rounded-2xl mb-5">
              <svg className="h-10 w-10 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z" />
              </svg>
            </div>
            <p className="text-lg font-medium text-gray-500 mb-1">No bookmarks yet</p>
            <p className="text-gray-400">Paste a URL above to get started</p>
          </div>
        )}

        {bookmarks && bookmarks.length > 0 && (
          <>
            {/* Category Pills */}
            {Array.isArray(categories) && categories.length > 0 && (
              <div className="flex flex-wrap gap-2 pb-2">
                <button
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                    selectedCategory === null
                      ? "bg-gray-900 text-white shadow-sm"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                  }`}
                  onClick={() => setSelectedCategory(null)}
                >
                  All
                  <span className="ml-1.5 text-xs opacity-60">{totalBookmarks}</span>
                </button>
                {categories.map((cat) => {
                  const count = bookmarks.filter((b) => b.category === cat).length;
                  const isSelected = selectedCategory === cat;
                  return (
                    <button
                      key={cat}
                      className={`px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 ${
                        isSelected
                          ? "bg-gray-900 text-white shadow-sm"
                          : "bg-white border border-gray-200 text-gray-600 hover:border-gray-300 hover:bg-gray-50"
                      }`}
                      onClick={() => setSelectedCategory(cat)}
                    >
                      {CATEGORY_ICONS[cat] ?? "📁"} {cat}
                      <span className={`ml-1.5 text-xs ${isSelected ? "opacity-60" : "opacity-40"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            )}

            {groupedEntries.map(([category, items]) => (
              <div key={category}>
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-lg">{CATEGORY_ICONS[category] ?? "📁"}</span>
                  <h2 className="text-base font-semibold text-gray-800">{category}</h2>
                  <span className="text-xs text-gray-400 ml-1">({items.length})</span>
                  <div className="flex-1 ml-3 h-px bg-gray-100" />
                </div>
                <div className="space-y-2">
                  {items.map((bm) => (
                    <div
                      key={bm.id}
                      className="flex items-center gap-3 p-4 bg-white border border-gray-100 rounded-xl hover:border-gray-200 hover:shadow-sm transition-all duration-200 group"
                    >
                      <FaviconImage url={bm.url} />
                      <div className="min-w-0 flex-1">
                        <a
                          href={bm.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-medium truncate block leading-snug"
                        >
                          {bm.title}
                        </a>
                        <p className="text-xs text-gray-400 truncate mt-0.5">
                          {bm.url}
                        </p>
                      </div>
                      <span
                        className={`text-[11px] font-medium px-2.5 py-1 rounded-full flex-shrink-0 ${
                          CATEGORY_COLORS[bm.category] ?? "bg-gray-100 text-gray-600"
                        }`}
                      >
                        {bm.category}
                      </span>
                      <button
                        className="p-1.5 text-gray-300 hover:text-red-500 hover:bg-red-50 rounded-lg opacity-0 group-hover:opacity-100 transition-all flex-shrink-0"
                        onClick={() => {
                          rpcClient.bookmarker.storage.remove(bm.id);
                        }}
                        title="Remove bookmark"
                      >
                        <svg
                          xmlns="http://www.w3.org/2000/svg"
                          className="h-4 w-4"
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