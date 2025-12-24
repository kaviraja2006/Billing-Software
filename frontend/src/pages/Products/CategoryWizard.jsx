import React, { useState, useEffect } from 'react';
import { Modal } from '../../components/ui/Modal';
import { Input } from '../../components/ui/Input';
import { Button } from '../../components/ui/Button';
import { Search, Tag, Check } from 'lucide-react';

const CategoryWizard = ({ isOpen, onClose, categories, onSelectCategory, title = "Select Category" }) => {
    const [searchQuery, setSearchQuery] = useState('');
    const [filteredCategories, setFilteredCategories] = useState(categories);

    useEffect(() => {
        if (isOpen) {
            setSearchQuery('');
            setFilteredCategories(categories);
        }
    }, [isOpen, categories]);

    useEffect(() => {
        const query = searchQuery.toLowerCase();
        setFilteredCategories(
            categories.filter(cat => cat.toLowerCase().includes(query))
        );
    }, [searchQuery, categories]);

    return (
        <Modal isOpen={isOpen} onClose={onClose} title={title}>
            <div className="space-y-4">
                {/* Search Bar */}
                <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                        placeholder="Search categories..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="pl-10"
                        autoFocus
                    />
                </div>

                {/* Categories List */}
                <div className="max-h-60 overflow-y-auto border rounded-md divide-y">
                    <div
                        className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 font-medium border-l-4 border-transparent hover:border-blue-500 transition-all"
                        onClick={() => { onSelectCategory(null); onClose(); }}
                    >
                        <div className="bg-slate-100 p-2 rounded-full"><Tag size={16} /></div>
                        <span>All Categories</span>
                    </div>
                    {filteredCategories.length > 0 ? (
                        filteredCategories.map((cat, index) => (
                            <div
                                key={index}
                                className="p-3 hover:bg-slate-50 cursor-pointer flex items-center gap-2 text-slate-700 border-l-4 border-transparent hover:border-blue-500 transition-all"
                                onClick={() => { onSelectCategory(cat); onClose(); }}
                            >
                                <div className="bg-blue-50 text-blue-600 p-2 rounded-full"><Tag size={16} /></div>
                                <span>{cat}</span>
                            </div>
                        ))
                    ) : (
                        <div className="p-8 text-center text-slate-500">
                            No categories found matching "{searchQuery}"
                        </div>
                    )}
                </div>

                <div className="flex justify-end pt-2">
                    <Button variant="outline" onClick={onClose}>Cancel</Button>
                </div>
            </div>
        </Modal>
    );
};

export default CategoryWizard;
