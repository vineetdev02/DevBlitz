'use client';

import React from 'react';
import { X, Star, Download, Settings, Trash2, Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useExtensionsStore } from '@/stores/extensionsStore';
import { motion, AnimatePresence } from 'framer-motion';
import { ScrollArea } from '@/components/ui/scroll-area';

export function ExtensionDetailView() {
  const {
    selectedExtensionId,
    setSelectedExtensionId,
    getExtensionById,
    installExtension,
    uninstallExtension,
    enableExtension,
    disableExtension,
    installedExtensions,
  } = useExtensionsStore();

  const [activeTab, setActiveTab] = React.useState<'details' | 'features'>('details');
  const [isInstalling, setIsInstalling] = React.useState(false);
  const [expandedConfigs, setExpandedConfigs] = React.useState<Set<string>>(new Set());

  if (!selectedExtensionId) return null;

  const extension = getExtensionById(selectedExtensionId);
  if (!extension) return null;

  const isInstalled = installedExtensions.some(e => e.id === extension.id);
  const installedVersion = installedExtensions.find(e => e.id === extension.id);

  const handleInstall = async () => {
    setIsInstalling(true);
    try {
      await installExtension(extension.id);
    } catch (error) {
      console.error('Failed to install extension:', error);
    } finally {
      setIsInstalling(false);
    }
  };

  const handleUninstall = async () => {
    await uninstallExtension(extension.id);
  };

  const toggleConfig = (key: string) => {
    const newSet = new Set(expandedConfigs);
    if (newSet.has(key)) {
      newSet.delete(key);
    } else {
      newSet.add(key);
    }
    setExpandedConfigs(newSet);
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="w-full h-full bg-background flex flex-col"
      >
        <ScrollArea className="flex-1">
          <div className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-6">
              <div className="flex gap-4 flex-1">
                {/* Icon */}
                <div className="w-24 h-24 bg-neutral-800 rounded-lg flex items-center justify-center flex-shrink-0">
                  {extension.icon ? (
                    <img src={extension.icon} alt={extension.name} className="w-full h-full object-contain" />
                  ) : (
                    <div className="text-4xl text-neutral-400">📦</div>
                  )}
                </div>

                {/* Title and info */}
                <div className="flex-1 min-w-0">
                  <h1 className="text-2xl font-bold text-foreground mb-2">{extension.name}</h1>
                  <p className="text-sm text-muted-foreground mb-3">{extension.publisher}</p>
                  
                  {/* Stats */}
                  <div className="flex items-center gap-4 flex-wrap">
                    {extension.rating && (
                      <div className="flex items-center gap-1">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={cn(
                              'w-4 h-4',
                              i < Math.floor(extension.rating!) 
                                ? 'fill-yellow-400 text-yellow-400' 
                                : 'text-neutral-600'
                            )}
                          />
                        ))}
                        <span className="text-sm text-muted-foreground ml-1">{extension.rating}</span>
                      </div>
                    )}
                    {extension.downloadCount && (
                      <div className="flex items-center gap-1 text-sm text-muted-foreground">
                        <Download className="w-4 h-4" />
                        <span>{(extension.downloadCount / 1000).toFixed(0)}K</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Close button */}
              <button
                onClick={() => setSelectedExtensionId(null)}
                className="p-2 hover:bg-accent rounded transition-colors ml-4"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Action buttons */}
            <div className="flex gap-2 mb-6 flex-wrap">
              {isInstalled ? (
                <>
                  {installedVersion?.enabled ? (
                    <button
                      onClick={() => disableExtension(extension.id)}
                      className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <Settings className="w-4 h-4" />
                      Disable
                    </button>
                  ) : (
                    <button
                      onClick={() => enableExtension(extension.id)}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 rounded text-sm flex items-center gap-2 transition-colors"
                    >
                      <Check className="w-4 h-4" />
                      Enable
                    </button>
                  )}
                  <button
                    onClick={handleUninstall}
                    className="px-4 py-2 bg-red-500/20 hover:bg-red-500/30 text-red-400 rounded text-sm flex items-center gap-2 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                    Uninstall
                  </button>
                  <label className="px-4 py-2 bg-neutral-800 hover:bg-neutral-700 rounded text-sm flex items-center gap-2 transition-colors cursor-pointer">
                    <input
                      type="checkbox"
                      checked={true}
                      readOnly
                      className="w-4 h-4"
                    />
                    Auto Update
                  </label>
                </>
              ) : (
                <button
                  onClick={handleInstall}
                  disabled={isInstalling}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed rounded text-sm flex items-center gap-2 transition-colors"
                >
                  {isInstalling ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                      Installing...
                    </>
                  ) : (
                    <>
                      <Download className="w-4 h-4" />
                      Install
                    </>
                  )}
                </button>
              )}
            </div>

            {/* Tabs */}
            <div className="flex gap-1 border-b border-border mb-6">
              <button
                onClick={() => setActiveTab('details')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'details'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                DETAILS
              </button>
              <button
                onClick={() => setActiveTab('features')}
                className={cn(
                  'px-4 py-2 text-sm font-medium border-b-2 transition-colors',
                  activeTab === 'features'
                    ? 'border-blue-500 text-blue-500'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                )}
              >
                FEATURES
              </button>
            </div>

            {/* Content */}
            {activeTab === 'details' && (
              <div className="space-y-6">
                {/* Description */}
                <div>
                  <h2 className="text-sm font-semibold text-foreground mb-2">Description</h2>
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    {extension.fullDescription || extension.description}
                  </p>
                </div>

                {/* Installation info */}
                {(extension.identifier || extension.version || extension.size) && (
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3">Installation</h2>
                    <div className="space-y-2 text-sm">
                      {extension.identifier && (
                        <div className="flex">
                          <span className="text-muted-foreground w-24 flex-shrink-0">Identifier:</span>
                          <span className="text-foreground">{extension.identifier}</span>
                        </div>
                      )}
                      {extension.version && (
                        <div className="flex">
                          <span className="text-muted-foreground w-24 flex-shrink-0">Version:</span>
                          <span className="text-foreground">{extension.version}</span>
                        </div>
                      )}
                      {extension.lastUpdated && (
                        <div className="flex">
                          <span className="text-muted-foreground w-24 flex-shrink-0">Last Updated:</span>
                          <span className="text-foreground">{extension.lastUpdated}</span>
                        </div>
                      )}
                      {extension.size && (
                        <div className="flex">
                          <span className="text-muted-foreground w-24 flex-shrink-0">Size:</span>
                          <span className="text-foreground">{extension.size}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Marketplace info */}
                {(extension.publishedDate || extension.lastReleased) && (
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3">Marketplace</h2>
                    <div className="space-y-2 text-sm">
                      {extension.publishedDate && (
                        <div className="flex">
                          <span className="text-muted-foreground w-28 flex-shrink-0">Published:</span>
                          <span className="text-foreground">{extension.publishedDate}</span>
                        </div>
                      )}
                      {extension.lastReleased && (
                        <div className="flex">
                          <span className="text-muted-foreground w-28 flex-shrink-0">Last Released:</span>
                          <span className="text-foreground">{extension.lastReleased}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Configuration */}
                {extension.configuration && extension.configuration.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3">Configuration</h2>
                    <div className="space-y-2">
                      {extension.configuration.map((config) => (
                        <div
                          key={config.key}
                          className="border border-border rounded p-3 bg-card"
                        >
                          <button
                            onClick={() => toggleConfig(config.key)}
                            className="w-full flex items-start justify-between gap-2 text-left"
                          >
                            <div className="flex-1">
                              <div className="font-mono text-xs text-blue-400 mb-1">{config.key}</div>
                              <div className="text-sm font-medium text-foreground mb-1">{config.title}</div>
                              <div className="text-xs text-muted-foreground">{config.description}</div>
                              {expandedConfigs.has(config.key) && config.default !== undefined && (
                                <div className="mt-2 text-xs text-muted-foreground">
                                  Default: <code className="bg-neutral-800 px-1 rounded">{String(config.default)}</code>
                                </div>
                              )}
                            </div>
                            {expandedConfigs.has(config.key) ? (
                              <ChevronUp className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            ) : (
                              <ChevronDown className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                            )}
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Categories */}
                {extension.categories && extension.categories.length > 0 && (
                  <div>
                    <h2 className="text-sm font-semibold text-foreground mb-3">Categories</h2>
                    <div className="flex flex-wrap gap-2">
                      {extension.categories.map((cat) => (
                        <span
                          key={cat}
                          className="px-3 py-1 bg-neutral-800 rounded text-xs text-muted-foreground"
                        >
                          {cat}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {activeTab === 'features' && (
              <div className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  Features and capabilities of this extension will be displayed here.
                </p>
                {/* In production, this would show actual extension features from the manifest */}
              </div>
            )}
          </div>
        </ScrollArea>
      </motion.div>
    </AnimatePresence>
  );
}

