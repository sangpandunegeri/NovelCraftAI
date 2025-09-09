export type Page = 'ai-writer' | 'manuscript' | 'assets' | 'database' | 'manuscript-analysis';

export interface Character {
    id: number;
    name: string;
    role: string;
    gender: string;
    age: string;
    country: string;
    faceDescription: string;
    hairDescription: string;
    clothingDescription: string;
    accessoryDescription: string;
    height: string;
    weight: string;
    bodyShape: string;
}

export interface Location {
    id: number;
    name: string;
    description: string;
}

export interface NovelObject {
    id: number;
    name: string;
    description: string;
}

export interface Reference {
    id: number;
    title: string;
    content: string;
}

export interface Chapter {
    title: string;
    content: string;
    charactersInChapter: number[];
    locationsInChapter: number[];
    objectsInChapter: number[];
    status: 'draft' | 'final';
    plotPoint?: string;
    summary?: string;
}

export interface NovelData {
    characters: Character[];
    locations: Location[];
    objects: NovelObject[];
    chapters: Chapter[];
    references: Reference[];
    currentChapterIndex: number;
    choices: {
        genre: string | null;
        writingStyle: string;
        premise: string;
        synopsis: string;
        opening: string | null;
        incident: string | null;
    };
    plotStructure: {
        totalChapters: number;
        conflictChapter: number;
        climaxChapter: number;
        ending: string | null;
        customEnding: string;
    };
}

export type Action =
    | { type: 'SET_NOVEL_DATA'; payload: any }
    | { type: 'UPDATE_CHOICE'; payload: { key: keyof NovelData['choices']; value: any } }
    | { type: 'UPDATE_PLOT_STRUCTURE'; payload: { key: keyof NovelData['plotStructure']; value: any } }
    | { type: 'SET_CHAPTER_CONTENT'; payload: string }
    | { type: 'SET_CURRENT_CHAPTER_INDEX'; payload: number }
    | { type: 'TOGGLE_CHAPTER_STATUS'; payload: number }
    | { type: 'DELETE_CHAPTER'; payload: number }
    | { type: 'ADD_CHAPTER'; payload: Chapter }
    | { type: 'UPDATE_FIRST_CHAPTER'; payload: Chapter }
    | { type: 'UPDATE_CHAPTER_PLOT_POINT'; payload: { chapterIndex: number; plotPoint: string } }
    | { type: 'UPDATE_CHAPTER_SUMMARY'; payload: { chapterIndex: number; summary: string } }
    | { type: 'UPDATE_CHAPTER_CONTENT'; payload: { chapterIndex: number; content: string } }
    | { type: 'UPDATE_CHAPTER_TITLE'; payload: { chapterIndex: number; title: string } }
    | { type: 'ADD_CHARACTER'; payload: Character }
    | { type: 'UPDATE_CHARACTER'; payload: { index: number; character: Character } }
    | { type: 'DELETE_CHARACTER'; payload: number }
    | { type: 'ADD_LOCATION'; payload: Location }
    | { type: 'UPDATE_LOCATION'; payload: { index: number; location: Location } }
    | { type: 'DELETE_LOCATION'; payload: number }
    | { type: 'ADD_OBJECT'; payload: NovelObject }
    | { type: 'UPDATE_OBJECT'; payload: { index: number; object: NovelObject } }
    | { type: 'DELETE_OBJECT'; payload: number }
    | { type: 'ADD_REFERENCE'; payload: Reference }
    | { type: 'UPDATE_REFERENCE'; payload: { index: number; reference: Reference } }
    | { type: 'DELETE_REFERENCE'; payload: number }
    | { type: 'RESET_NOVEL_DATA' }
    | { type: 'RESET_WIZARD_STATE' };