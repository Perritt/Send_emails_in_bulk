# React Quill 富文本编辑器升级指南

## 升级概述

本项目已将自定义富文本编辑器升级为 React Quill，提供更强大和稳定的编辑体验。

## 主要改进

### 1. 编辑器功能
- ✅ **格式化工具栏**: 粗体、斜体、下划线、删除线
- ✅ **字体设置**: 字体族、字体大小、颜色选择
- ✅ **段落格式**: 对齐方式、列表、引用
- ✅ **高级功能**: 链接、图片、表格、代码块
- ✅ **编辑工具**: 撤销、重做、格式刷

### 2. 用户体验
- ✅ **响应式设计**: 适配不同屏幕尺寸
- ✅ **快捷键支持**: 提高编辑效率
- ✅ **实时预览**: 所见即所得的编辑体验
- ✅ **变量插入**: 支持动态变量替换

### 3. 技术特性
- ✅ **模块化设计**: 可自定义工具栏
- ✅ **事件处理**: 完善的编辑事件监听
- ✅ **内容验证**: 自动清理和格式化
- ✅ **性能优化**: 高效的渲染机制

## 技术实现

### 依赖安装
```bash
npm install react-quill quill
```

### 基本配置
```javascript
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';

const modules = {
  toolbar: [
    ['bold', 'italic', 'underline', 'strike'],
    ['blockquote', 'code-block'],
    [{ 'header': 1 }, { 'header': 2 }],
    [{ 'list': 'ordered'}, { 'list': 'bullet' }],
    [{ 'script': 'sub'}, { 'script': 'super' }],
    [{ 'indent': '-1'}, { 'indent': '+1' }],
    [{ 'direction': 'rtl' }],
    [{ 'size': ['small', false, 'large', 'huge'] }],
    [{ 'header': [1, 2, 3, 4, 5, 6, false] }],
    [{ 'color': [] }, { 'background': [] }],
    [{ 'font': [] }],
    [{ 'align': [] }],
    ['clean'],
    ['link', 'image', 'video']
  ]
};
```

### 变量插入功能
```javascript
function insertVariable(variable) {
  const quill = quillRef.current.getEditor();
  const range = quill.getSelection();
  if (range) {
    quill.insertText(range.index, `{${variable}}`);
  }
}
```

## 样式定制

### 主题样式
```css
.ql-editor {
  min-height: 200px;
  font-family: 'Arial', sans-serif;
  line-height: 1.6;
}

.ql-toolbar {
  border-top: 1px solid #ccc;
  border-left: 1px solid #ccc;
  border-right: 1px solid #ccc;
}
```

### 自定义按钮
```javascript
const CustomButton = () => (
  <span className="ql-formats">
    <button type="button" onClick={insertVariable}>
      插入变量
    </button>
  </span>
);
```

## 迁移指南

### 从自定义编辑器迁移
1. **移除旧代码**: 删除自定义编辑器相关代码
2. **安装依赖**: 安装 React Quill
3. **更新组件**: 替换编辑器组件
4. **调整样式**: 更新 CSS 样式
5. **测试功能**: 验证所有功能正常

### 数据兼容性
- ✅ 支持 HTML 格式内容
- ✅ 保持变量替换功能
- ✅ 兼容现有邮件模板

## 性能优化

### 懒加载
```javascript
const ReactQuill = React.lazy(() => import('react-quill'));
```

### 内容缓存
```javascript
const [content, setContent] = useState('');
const debouncedContent = useDebounce(content, 500);
```

## 故障排除

### 常见问题

#### 1. 工具栏不显示
- 检查 CSS 文件是否正确引入
- 验证模块配置是否正确

#### 2. 变量插入失败
- 确认编辑器实例已正确获取
- 检查选择范围是否有效

#### 3. 样式冲突
- 使用 CSS 作用域隔离
- 检查全局样式影响

### 调试技巧
```javascript
// 获取编辑器实例
const quill = quillRef.current.getEditor();

// 监听内容变化
quill.on('text-change', (delta, oldDelta, source) => {
  console.log('Content changed:', delta);
});

// 获取当前内容
const content = quill.root.innerHTML;
```

## 未来计划

### 功能增强
- [ ] 支持更多媒体类型
- [ ] 添加模板功能
- [ ] 实现协同编辑
- [ ] 支持 Markdown 语法

### 性能提升
- [ ] 虚拟滚动优化
- [ ] 内存使用优化
- [ ] 渲染性能提升

---

💡 **提示**: 升级完成后，建议进行全面的功能测试，确保所有特性正常工作。
