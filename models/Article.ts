import mongoose from 'mongoose';

export interface IVocabularyDetail {
    word: string;
    sentence: string;
}

export interface IArticle extends mongoose.Document {
    originalId: string;
    title: string;
    simplifiedText: string;
    coreVocabulary: string[];
    vocabularyDetails?: IVocabularyDetail[];
    chineseSummary: string;
    pubDate: Date;
    imageUrl?: string;
    category?: string;
    source?: string;
    originalUrl?: string;
    createdAt: Date;
    updatedAt: Date;
}

const ArticleSchema = new mongoose.Schema<IArticle>(
    {
        originalId: { type: String, required: true, unique: true },
        title: { type: String, required: true },
        simplifiedText: { type: String, required: true },
        coreVocabulary: { type: [String], default: [] },
        vocabularyDetails: [{
            word: String,
            sentence: String
        }],
        chineseSummary: { type: String, required: true },
        pubDate: { type: Date, required: true },
        imageUrl: { type: String },
        category: { type: String },
        source: { type: String },
        originalUrl: { type: String },
    },
    { timestamps: true }
);

export default mongoose.models.Article || mongoose.model<IArticle>('Article', ArticleSchema);
