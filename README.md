# Auto-Git-Flow (agf)

自动化 Git 工作流工具，旨在规范分支命名并简化日常合并操作。

## 安装与使用

```bash
# 开发环境运行
npm run dev

# 编译后使用
agf --help
```

## 核心流程

### 1. 分支创建流程 (Create)

使用 `git-flow create` 创建新分支。如果是 `dev` 或 `release` 分支，会自动推送到远程并切回原分支；如果是 `feature` 分支，则留在新分支。

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

### 2. 分支合并流程 (Merge)

使用 `git-flow merge [dev|release]` 将当前特性分支合并到目标环境。

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

## 分支命名规范

- **Feature**: `feat/<username>-<date>-<reqNo>` (例如: `feat/jack-20231024-QZ-8848`)
- **Dev**: `<project>-DEV-<date>` (例如: `mall-DEV-20231024`)
- **Release**: `<project>-RELEASE-<date>` (例如: `mall-RELEASE-20231024`)