# 🚀 Auto-Git-Flow (agf)

[![npm version](https://img.shields.io/npm/v/@sppk/auto-git-flow.svg)](https://www.npmjs.com/package/@sppk/auto-git-flow)

**Auto-Git-Flow** 是一个专为团队协作设计的 Git 工作流自动化工具。它通过命令行交互（CLI）规范化分支命名，并自动处理繁琐的合并流程，防止人为错误，提升交付效率。

---

## ✨ 核心特性

- 🛠 **命名规范化**: 自动生成符合团队约定的 `feat/`, `DEV-`, `RELEASE-` 分支名称。
- 🔄 **合并自动化**: 一键同步基准分支、合并代码并推送到远程，减少手工误操作。
- 📋 **全景视图**: 快速查看当前项目的开发（Dev）与发布（Release）分支状态。
- 🛡 **安全检查**: 执行前自动检查工作区状态，确保代码提交安全。
- ⌨️ **交互式体验**: 基于 `@inquirer/prompts` 提供平滑的命令行交互。

---

## 📦 安装

### 全局安装 (推荐)

```bash
pnpm add -g @sppk/auto-git-flow
```

### 直接运行 (无需安装)

```bash
pnpx agf --help
```

---

## 🛠 常用命令

### 1. 查看分支状态 `agf list`
展示最近的开发分支与发布分支列表。
```bash
agf list [count] # 默认查看最近 2 个
```

### 2. 创建新分支 `agf create`
根据类型（Feature/Dev/Release）和需求号自动生成规范分支。
```bash
agf create
```

### 3. 合并分支 `agf merge`
将当前 Feature 分支自动同步基准代码并合并到指定的目标分支（Dev 或 Release）。
```bash
agf merge [target] # target 为必填：dev 或 release。
```

## 📋 命名规范

工具严格遵循以下命名约定：

- **Feature**: `feat/<username>-<date>-<reqNo>`  
  *示例: `feat/jack-20231024-QZ-8848`*
- **Dev**: `<project>-DEV-<date>`  
  *示例: `mall-DEV-20231024`*
- **Release**: `<project>-RELEASE-<date>`  
  *示例: `mall-RELEASE-20231024`*

## 📐 工作流图解

### 分支创建流程 (Create)
如果是 `dev` 或 `release` 分支，会自动推送到远程并切回原分支；如果是 `feature` 分支，则留在新分支。

```mermaid
graph TD
    Start([开始创建]) --> CheckClean{检查工作区}
    CheckClean -- 脏 --> Error([提示保存并退出])
    CheckClean -- 干净 --> Fetch[获取远程更新]
    Fetch --> Config[采集配置: 类型/日期/需求号]
    Config --> Name[生成规范名称]
    Name --> Checkout[从 Base 分支创建并切换]
    Checkout --> TypeCheck{分支类型?}
    
    TypeCheck -- Feature --> DoneFeature([切到新分支, 完成])
    TypeCheck -- Dev/Release --> Push[推送到远程]
    Push --> Back[切回原分支]
    Back --> DoneOther([完成])
```

### 分支合并流程 (Merge)
将当前特性分支合并到目标环境。会自动先同步 `Release` 与 `Dev`、`Main` 分支的代码，确保环境一致性。

```mermaid
graph TD
    Start([开始合并]) --> CheckClean{检查工作区}
    CheckClean -- 脏 --> Error([提示保存并退出])
    CheckClean -- 干净 --> CheckType{当前是 Feature?}
    
    CheckType -- 否 --> ErrorType([只允许从 Feature 发起])
    CheckType -- 是 --> FindTarget[定位目标分支]
    
    FindTarget --> Exist{目标分支存在?}
    Exist -- 否 --> CreateNew[引导创建并推送]
    Exist -- 是 --> Sync[同步目标与基准分支]
    
    CreateNew --> Sync
    Sync --> Confirm{如果是 Release?}
    Confirm -- 是 --> UserConfirm[二次人工确认]
    Confirm -- 否 --> DoMerge
    
    UserConfirm -- 取消 --> End([结束])
    UserConfirm -- 确认 --> DoMerge[执行合并]
    
    DoMerge --> MergeBase[基准 -> 目标]
    MergeBase --> MergeFeat[Feature -> 目标]
    MergeFeat --> Push[推送目标分支]
    Push --> Back[切回 Feature 分支]
    Back --> Done([合并完成])

    classDef highlight fill:#f96,stroke:#333,stroke-width:2px
    class MergeBase,UserConfirm highlight
```


