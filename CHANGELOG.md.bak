# 📝 Changelog

All notable changes to Prometheus Assistant will be documented in this file.

## [2.0.0] - 2025-09-26

### 🚀 Major Features Added
- **ChromaDB Integration**: Full vector database support for semantic search
- **RAG System**: Retrieval-Augmented Generation with code chunking
- **Semantic Search**: Context-aware code search beyond keyword matching
- **Code Chunking**: Automatic text and semantic chunking of source files
- **Vector Embeddings**: Persistent storage of code embeddings

### 🔧 Technical Improvements
- **ChromaDBService**: New service for vector database operations
- **Enhanced ProjectScanner**: Added chunking and ChromaDB processing
- **Hybrid Search**: Combined semantic and traditional search
- **Error Handling**: Graceful degradation when ChromaDB unavailable
- **Performance Optimization**: Smart file filtering and chunk sizing

### 📦 Dependencies Added
- `chromadb@^1.5.3`: Vector database client

### 🐳 Infrastructure
- **docker-compose.yml**: ChromaDB container configuration
- **Port 8000**: ChromaDB HTTP API endpoint
- **Persistent Storage**: ChromaDB data survives container restarts

### 📚 Documentation
- **INSTALLATION.md**: Complete installation guide for other machines
- **TECHNICAL_NOTES.md**: Implementation details and lessons learned
- **README.md**: Updated with ChromaDB features and requirements

### 🔄 Migration
- **Backward Compatible**: Existing YAML storage continues to work
- **Zero Breaking Changes**: All existing MCP tools unchanged
- **Progressive Enhancement**: Works with or without ChromaDB

---

## [1.0.0] - 2025-09-25

### 🎉 Initial Release
- **MCP Server**: Model Context Protocol integration with Claude Code
- **Project Scanning**: Automatic file structure analysis
- **YAML Storage**: Persistent project context storage
- **File Watching**: Real-time project change monitoring
- **Multi-Project Support**: Isolated contexts for different projects

### 🛠️ MCP Tools
- `get_project_context`: Comprehensive project information
- `search_project_knowledge`: Text-based project search
- `get_development_status`: Recent changes and activity
- `update_project_context`: Development notes and decisions
- `scan_project`: Force project re-analysis

### 📁 Project Structure
- **src/services/**: Core business logic
- **data/contexts/**: Project context storage
- **health-check.cjs**: System health verification
- **setup-mcp.sh**: Automated MCP integration

### 🔍 Features
- **Persistent Memory**: Projects remembered across Claude sessions
- **Context Preservation**: Work continues after context window limits
- **Development Tracking**: Notes, decisions, and task management
- **File Analysis**: Language detection and import extraction

---

## Development Notes

### Version Numbering
- **Major version**: Breaking changes or significant new features
- **Minor version**: New features, backward compatible
- **Patch version**: Bug fixes and small improvements

### Release Process
1. Update CHANGELOG.md
2. Update package.json version
3. Tag release: `git tag v2.0.0`
4. Push changes: `git push --tags`

### Next Planned Features
- [ ] Custom embedding models
- [ ] Performance metrics dashboard
- [ ] Multi-language code parsing improvements
- [ ] Real-time collaborative features
- [ ] Enterprise deployment options

---

*For installation instructions, see [INSTALLATION.md](INSTALLATION.md)*
*For technical details, see [TECHNICAL_NOTES.md](TECHNICAL_NOTES.md)*