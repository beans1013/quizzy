import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';

interface MathRendererProps {
  content: string;
  className?: string;
}

const MathRenderer: React.FC<MathRendererProps> = ({ content, className = '' }) => {
  return (
    <div className={`prose prose-invert prose-p:leading-relaxed max-w-none ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath]}
        rehypePlugins={[rehypeKatex]}
        components={{
            p: ({node, ...props}) => <p className="mb-2" {...props} />,
            strong: ({node, ...props}) => <strong className="text-yellow-400 font-bold" {...props} />,
            code: ({node, ...props}) => <code className="bg-zinc-800 text-cyan-400 px-1 py-0.5 rounded-none" {...props} />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MathRenderer;