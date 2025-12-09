'use client';

import React, { useEffect, useState } from 'react';
import { Search, Download, X, Check, Star, Users, Package, Settings, Trash2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExtensionsStore, Extension } from '@/stores/extensionsStore';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion, AnimatePresence } from 'framer-motion';
import { ExtensionDetailView } from './ExtensionDetailView';

const categories = ['All', 'Formatters', 'Linters', 'SCM', 'Programming Languages', 'Other'];

export function ExtensionsPanel() {
  const {
    extensions,
    installedExtensions,
    searchQuery,
    selectedCategory,
    isLoading,
    selectedExtensionId,
    setSearchQuery,
    setSelectedCategory,
    setSelectedExtensionId,
    searchExtensions,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
    loadInstalledExtensions,
  } = useExtensionsStore();

  const [activeTab, setActiveTab] = useState<'marketplace' | 'installed'>('installed');

  // Load installed extensions on mount
  useEffect(() => {
    loadInstalledExtensions();
  }, [loadInstalledExtensions]);

  useEffect(() => {
    if (activeTab === 'marketplace') {
      searchExtensions(searchQuery || '');
    }
  }, [activeTab, searchQuery, searchExtensions]);

  useEffect(() => {
    const timeoutId = setTimeout(() => {
      if (activeTab === 'marketplace') {
        searchExtensions(searchQuery);
      }
    }, 300);
    return () => clearTimeout(timeoutId);
  }, [searchQuery, activeTab]);

  // Filter installed extensions by search query
  const filteredInstalledExtensions = activeTab === 'installed'
    ? installedExtensions.filter(ext => {
        if (!searchQuery) return true;
        const query = searchQuery.toLowerCase();
        return (
          ext.name.toLowerCase().includes(query) ||
          ext.description.toLowerCase().includes(query) ||
          ext.publisher.toLowerCase().includes(query)
        );
      })
    : [];

  const filteredExtensions = activeTab === 'installed'
    ? filteredInstalledExtensions
    : selectedCategory && selectedCategory !== 'All'
    ? extensions.filter(e => e.category === selectedCategory)
    : extensions;

  return (
    <div className="flex h-full relative">
      {/* Left panel - List */}
      <div className={cn(
        'flex flex-col transition-all duration-200',
        selectedExtensionId ? 'w-1/2 border-r border-border' : 'w-full'
      )}>
        {/* Tabs */}
        <div className="flex items-center border-b border-border px-4">
        <button
          onClick={() => setActiveTab('marketplace')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'marketplace'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Marketplace
        </button>
        <button
          onClick={() => setActiveTab('installed')}
          className={cn(
            'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
            activeTab === 'installed'
              ? 'border-blue-500 text-blue-500'
              : 'border-transparent text-muted-foreground hover:text-foreground'
          )}
        >
          Installed ({installedExtensions.length})
        </button>
      </div>

      {/* Search bar */}
      <div className="p-4 border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={activeTab === 'installed' ? 'Search installed extensions...' : 'Search Extensions in Marketplace'}
            className="w-full pl-10 pr-4 py-2 bg-background border border-border rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
      </div>

      {/* Category filter - Responsive with horizontal scroll */}
      {activeTab === 'marketplace' && (
        <div className="px-4 py-2 border-b border-border overflow-x-auto scrollbar-thin scrollbar-thumb-neutral-700 scrollbar-track-transparent">
          <div className="flex gap-2 min-w-max">
            {categories.map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat === 'All' ? null : cat)}
                className={cn(
                  'px-3 py-1 text-xs rounded-md whitespace-nowrap transition-colors flex-shrink-0',
                  (selectedCategory === null && cat === 'All') || selectedCategory === cat
                    ? 'bg-blue-500/20 text-blue-400'
                    : 'bg-card text-muted-foreground hover:bg-accent'
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Extensions list */}
      <ScrollArea className="flex-1">
        {isLoading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500" />
          </div>
        ) : filteredExtensions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-48 text-muted-foreground">
            <Package className="w-12 h-12 mb-3 opacity-50" />
            <p className="text-sm">
              {activeTab === 'installed' ? 'No extensions installed' : 'No extensions found'}
            </p>
          </div>
        ) : (
          <div className="p-4 space-y-2">
            <AnimatePresence>
              {filteredExtensions.map((extension) => (
                <ExtensionCard
                  key={extension.id}
                  extension={extension}
                  isInstalled={activeTab === 'installed'}
                  onInstall={() => installExtension(extension.id)}
                  onUninstall={() => uninstallExtension(extension.id)}
                  onEnable={() => enableExtension(extension.id)}
                  onDisable={() => disableExtension(extension.id)}
                  onClick={() => setSelectedExtensionId(extension.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </ScrollArea>
      </div>

      {/* Right panel - Extension Detail View */}
      {selectedExtensionId && (
        <div className="w-1/2 flex flex-col">
          <ExtensionDetailView />
        </div>
      )}
    </div>
  );
}

interface ExtensionCardProps {
  extension: Extension;
  isInstalled: boolean;
  onInstall: () => void;
  onUninstall: () => void;
  onEnable: () => void;
  onDisable: () => void;
  onClick: () => void;
}

function ExtensionCard({
  extension,
  isInstalled,
  onInstall,
  onUninstall,
  onEnable,
  onDisable,
  onClick,
}: ExtensionCardProps) {
  const [isInstalling, setIsInstalling] = useState(false);

  const handleInstall = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInstalling(true);
    await onInstall();
    setIsInstalling(false);
  };

  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      onClick={onClick}
      className="bg-card border border-border rounded-lg p-4 hover:bg-accent/50 transition-colors cursor-pointer"
    >
      <div className="flex gap-4">
        {/* Icon placeholder */}
        <div className="w-16 h-16 bg-neutral-800 rounded flex items-center justify-center flex-shrink-0">
          <Package className="w-8 h-8 text-neutral-400" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <h3 className="font-semibold text-foreground truncate">{extension.name}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {extension.publisher} • v{extension.version}
              </p>
              <p className="text-sm text-muted-foreground mt-2 line-clamp-2">
                {extension.description}
              </p>

              {/* Stats */}
              <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground">
                {extension.rating && (
                  <div className="flex items-center gap-1">
                    <Star className="w-3 h-3 fill-yellow-400 text-yellow-400" />
                    <span>{extension.rating}</span>
                  </div>
                )}
                {extension.downloadCount && (
                  <div className="flex items-center gap-1">
                    <Users className="w-3 h-3" />
                    <span>{(extension.downloadCount / 1000000).toFixed(1)}M</span>
                  </div>
                )}
                {extension.category && (
                  <span className="px-2 py-0.5 bg-neutral-800 rounded text-xs">
                    {extension.category}
                  </span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col gap-2 flex-shrink-0">
              {isInstalled ? (
                <>
                  {extension.enabled ? (
                    <button
                      onClick={(e) => handleActionClick(e, onDisable)}
                      className="px-3 py-1.5 text-xs bg-neutral-800 hover:bg-neutral-700 rounded transition-colors flex items-center gap-1.5"
                    >
                      <Settings className="w-3 h-3" />
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={(e) => handleActionClick(e, onEnable)}
                      className="px-3 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 rounded transition-colors flex items-center gap-1.5"
                    >
                      <Check className="w-3 h-3" />
                      Enable
                    </button>
                  )}
                  <button
                    onClick={(e) => handleActionClick(e, onUninstall)}
                    className="px-3 py-1.5 text-xs bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded transition-colors flex items-center gap-1.5"
                  >
                    <Trash2 className="w-3 h-3" />
                    Uninstall
                  </button>
                </>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="px-4 py-1.5 text-xs bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded transition-colors flex items-center gap-1.5"
                >
                  {isInstalling ? (
                    <>
                      <div className="animate-spin rounded-full h-3 w-3 border-b-2 border-white" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-3 h-3" />
                      Install
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}



